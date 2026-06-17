import pg from 'pg';
const { Pool } = pg;

// Inisialisasi koneksi pool ke Supabase menggunakan variabel DATABASE_URL di Vercel
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Wajib true/diaktifkan untuk koneksi cloud aman Supabase
  }
});

export default async function handler(req, res) {
  // Atur CORS Header agar semua file HTML (admin, pembeli, penjual) bisa akses aman
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // === 1. PROSES GET (MEMBACA DATA UNTUK TABEL & MONITORING) ===
  if (req.method === 'GET') {
    try {
      // Mengambil semua data kamar, diurutkan dari yang paling baru (id terbesar)
      const result = await pool.query('SELECT * FROM rooms ORDER BY id DESC');
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Supabase GET Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // === 2. PROSES POST (TERBITKAN TOKEN KAMAR BARU DARI ADMIN.HTML) ===
  if (req.method === 'POST') {
    try {
      const { roomCode, game, price, buyer_wallet, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller } = req.body;

      // Pastikan harga dikonversi ke angka integer agar cocok dengan tipe data BIGINT di Supabase
      const numericPrice = parseInt(price) || 0;

      // Query PostgreSQL menggunakan parameter dolar ($1, $2, dst.) dan kolom berhuruf kapital wajib dibungkus kutip dua ""
      const text = `
        INSERT INTO rooms ("roomCode", game, price, buyer_wallet, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING id
      `;
      
      const values = [roomCode, game, numericPrice, buyer_wallet, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller];
      
      const result = await pool.query(text, values);

      // Kembalikan tanda sukses ke frontend admin.html
      return res.status(200).json({ success: true, id: result.rows[0].id });

    } catch (error) {
      console.error("Supabase POST Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method tidak diizinkan' });
}