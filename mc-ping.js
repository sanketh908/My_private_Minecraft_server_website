const net = require('net');

function writeVarInt(val) {
  const buf = [];
  while (true) {
    if ((val & 0xFFFFFF80) === 0) {
      buf.push(val);
      return Buffer.from(buf);
    }
    buf.push((val & 0x7F) | 0x80);
    val >>>= 7;
  }
}

function readVarInt(buffer, offset = 0) {
  let value = 0;
  let size = 0;
  let b;
  while (true) {
    b = buffer.readUInt8(offset + size);
    value |= (b & 0x7F) << (size * 7);
    size++;
    if ((b & 0x80) !== 128) {
      break;
    }
  }
  return { value, size };
}

/**
 * Pings a Minecraft server to get its status
 * @param {string} host - The server IP/host
 * @param {number} port - The server port (default 25565)
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<{online: boolean, players: number, maxPlayers: number, latency: number, version: string, motd: string}>}
 */
function pingMinecraftServer(host, port = 25565, timeout = 2500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const startTime = Date.now();
    let dataBuffer = Buffer.alloc(0);

    socket.setTimeout(timeout);

    socket.connect(port, host, () => {
      // Build Handshake Packet
      const packetId = writeVarInt(0x00);
      const protocolVersion = writeVarInt(763); // 1.20+ protocol version
      const hostBuffer = Buffer.from(host, 'utf8');
      const hostLength = writeVarInt(hostBuffer.length);
      const portBuffer = Buffer.alloc(2);
      portBuffer.writeUInt16BE(port, 0);
      const nextState = writeVarInt(1); // 1 for status query

      const handshakeBody = Buffer.concat([packetId, protocolVersion, hostLength, hostBuffer, portBuffer, nextState]);
      const handshakeHeader = writeVarInt(handshakeBody.length);
      const handshakePacket = Buffer.concat([handshakeHeader, handshakeBody]);

      // Build Request Packet
      const requestBody = writeVarInt(0x00); // Request Packet ID
      const requestHeader = writeVarInt(requestBody.length);
      const requestPacket = Buffer.concat([requestHeader, requestBody]);

      // Send both
      socket.write(handshakePacket);
      socket.write(requestPacket);
    });

    socket.on('data', (data) => {
      dataBuffer = Buffer.concat([dataBuffer, data]);
      
      try {
        // We need at least enough data to read the packet length
        if (dataBuffer.length < 3) return;

        const packetLengthInfo = readVarInt(dataBuffer, 0);
        const packetLength = packetLengthInfo.value;
        const totalHeaderLength = packetLengthInfo.size;

        if (dataBuffer.length < packetLength + totalHeaderLength) {
          // Keep buffering
          return;
        }

        // We have the full packet. Parse it.
        const packetIdInfo = readVarInt(dataBuffer, totalHeaderLength);
        const packetId = packetIdInfo.value;
        const jsonLengthInfo = readVarInt(dataBuffer, totalHeaderLength + packetIdInfo.size);
        const jsonLength = jsonLengthInfo.value;
        const jsonOffset = totalHeaderLength + packetIdInfo.size + jsonLengthInfo.size;

        if (dataBuffer.length < jsonOffset + jsonLength) {
          return; // Buffer not full yet
        }

        const jsonString = dataBuffer.toString('utf8', jsonOffset, jsonOffset + jsonLength);
        const parsed = JSON.parse(jsonString);

        socket.destroy();

        let motd = "A Minecraft Server";
        if (parsed.description) {
          if (typeof parsed.description === 'string') {
            motd = parsed.description;
          } else if (typeof parsed.description === 'object') {
            motd = parsed.description.text || "";
            if (parsed.description.extra && Array.isArray(parsed.description.extra)) {
              motd += parsed.description.extra.map(e => e.text || "").join("");
            }
          }
        }

        resolve({
          online: true,
          players: parsed.players ? parsed.players.online : 0,
          maxPlayers: parsed.players ? parsed.players.max : 0,
          latency: Date.now() - startTime,
          version: parsed.version ? parsed.version.name : "1.20+",
          motd: motd.replace(/§[0-9a-fk-or]/gi, '') // Strip color codes for dashboard
        });
      } catch (err) {
        // Parsing error or format mismatch
        socket.destroy();
        resolve({ online: false, err: "Parse error: " + err.message });
      }
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ online: false, err: "Timeout" });
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve({ online: false, err: err.message });
    });
  });
}

module.exports = pingMinecraftServer;
