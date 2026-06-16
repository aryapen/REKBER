import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: "thr-49.h.filess.io",
  user: "room_bottlesea",
  password: "f09cf68286cbcbba65e8c8874450d82c1472af53",
  database: "room_bottlesea",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 2, // Diperkecil agar tidak rebutan koneksi
  queueLimit: 0,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- COBA JALUR GET YANG ANTI-CRASH ---
  if (req.method === 'GET') {
    try {
      // Kita coba kueri data
      const [rows] = await pool.query('SELECT * FROM rooms');
      
      // Pastikan rows adalah array. Kalau kosong, kirim array kosong []
      return res.status(200).json(Array.isArray(rows) ? rows : []);
    } catch (error) {
      // JIKA DATABASE ERROR, KITA PAKSA KIRIM DATA PASUKAN DIAGNOSIS
      // Supaya admin.html tidak memicu pesan error 500 lagi
      return res.status(200).json([
        {
          id: 1,
          roomCode: "DIAGNOSIS-ERROR",
          game: "MySQL Error",
          price: 0,
          status: "LOG_CEK",
          buyer_wallet: error.message // Pesan error asli nampang di kolom wallet nanti!
        }
      ]);
    }
  }

  // --- JALUR POST (YANG KATAMU SUDAH BISA) ---
  if (req.method === 'POST') {
    try {
      const data = req.body;
      const querySql = `
        INSERT INTO rooms 
        (roomCode, game, price, buyer_wallet, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        data.roomCode, data.game, data.price, data.buyer_wallet, 
        data.status, data.akun_id, data.akun_pass, data.akun_req, 
        data.loc_buyer, data.loc_seller
      ];

      await pool.query(querySql, params);
      return res.status(201).json({ success: true, message: `Sukses Menerbitkan Token Baru: ${data.roomCode}` });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ message: "Method tidak diizinkan" });
}