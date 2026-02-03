"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    return res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        network: 'devnet',
        project: 'AlphaStake',
        description: 'On-chain verifiable trading signals with staked reputation',
    });
}
