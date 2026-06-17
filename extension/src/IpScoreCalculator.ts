import * as os from 'os';

export function getAddressScores(): Record<string, number> {
    const interfaces = os.networkInterfaces();
    const scores: Record<string, number> = {};

    for (const devName in interfaces) {
        const iface = interfaces[devName];
        if (!iface) continue;

        const isVirtual = /vEthernet|WSL|Virtual|VMware|docker|Tailscale|ZeroTier/i.test(devName);
        const isPhysical = /Wi-Fi|Ethernet|en0|eth0|wlan0/i.test(devName);

        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                let score = 0;
                if (isPhysical && !isVirtual) score = 100;
                else if (!isVirtual) score = 50;
                else score = 10;

                if (alias.address.startsWith('192.168.')) score += 5;
                if (alias.address.startsWith('10.0.')) score += 5;

                scores[alias.address] = score;
            }
        }
    }
    return scores;
}
