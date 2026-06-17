import pg from 'pg';
const { Pool } = pg;

// === PENTING: GANTI [password-kamu] DI BAWAH DENGAN PASSWORD ASLI SUPABASE-MU ===
const koneksiSupabase = "postgres://postgres.uxkjfefrkzpvmkxiifoh:[password-kamu]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString: koneksiSupabase,
  ssl: {
    rejectUnauthorized: false // Wajib diaktifkan agar koneksi ke cloud Supabase aman
  }
});

export default async function handler(req, res) {
  // Atur CORS Header agar admin.html, index.html, dan penjual.html bisa akses tanpa diblokir
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // =========================================================================
  // 1. AMBIL DATA TABEL (GET) - Dipakai renderAdminTableOnline / setInterval
  // =========================================================================
  if (req.method === 'GET') {
    try {
      // Mengambil semua data kamar, diurutkan dari yang paling baru
      const result = await pool.query('SELECT * FROM rooms ORDER BY id DESC');
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Supabase GET Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // =========================================================================
  // 2. BUAT KAMAR BARU ATAU UPDATE DATA (POST)
  // =========================================================================
  if (req.method === 'POST') {
    try {
      const { roomCode, game, price, buyer_wallet, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller } = req.body;
      
      // Deteksi otomatis: Jika data memiliki ID atau statusnya berubah, berarti ini adalah perintah UPDATE
      if (req.body.id || (status && status !== "Menunggu Input Kesepakatan Buyer")) {
        const text = `
          UPDATE rooms SET 
            status = COALESCE($1, status), 
            akun_id = COALESCE($2, akun_id), 
            akun_pass = COALESCE($3, akun_pass), 
            akun_req = COALESCE($4, akun_req), 
            loc_buyer = COALESCE($5, loc_buyer), 
            loc_seller = COALESCE($6, loc_seller)
          WHERE id = $7 OR "roomCode" = $8
        `;
        const values = [status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller, req.body.id || null, roomCode];
        await pool.query(text, values);
        
        return res.status(200).json({ success: true, message: "Kamar berhasil diperbarui!" });
      }

      // Jika normal (data baru), jalankan perintah INSERT (Terbitkan Kamar Baru)
      const text = `
        INSERT INTO rooms ("roomCode", game, price, buyer_wallet, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING id
      `;
      const values = [roomCode, game, parseInt(price) || 0, buyer_wallet, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller];
      const result = await pool.query(text, values);
      
      return res.status(200).json({ success: true, id: result.rows[0].id });
    } catch (error) {
      console.error("Supabase POST Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // =========================================================================
  // 3. MEMPERBARUI DATA KAMAR SECARA SPESIFIK (PUT)
  // =========================================================================
  if (req.method === 'PUT') {
    try {
      const { id, roomCode, status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller } = req.body;
      
      const text = `
        UPDATE rooms SET 
          status = COALESCE($1, status), 
          akun_id = COALESCE($2, akun_id), 
          akun_pass = COALESCE($3, akun_pass), 
          akun_req = COALESCE($4, akun_req), 
          loc_buyer = COALESCE($5, loc_buyer), 
          loc_seller = COALESCE($6, loc_seller)
        WHERE id = $7 OR "roomCode" = $8
      `;
      const values = [status, akun_id, akun_pass, akun_req, loc_buyer, loc_seller, id || null, roomCode];
      await pool.query(text, values);
      
      return res.status(200).json({ success: true, message: "Kamar berhasil diupdate via PUT!" });
    } catch (error) {
      console.error("Supabase PUT Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Jika ada method selain GET, POST, PUT
  return res.status(405).json({ message: 'Method tidak diizinkan' });
}