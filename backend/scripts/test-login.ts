/**
 * Script para probar el endpoint de login
 */

import fetch from 'node-fetch'

async function main() {
  const email = 'pradoignacio.utn@icloud.com'
  const password = 'Admin123!'
  
  console.log('🔐 Probando login...')
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${password}`)
  console.log()

  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    console.log(`📡 Status: ${response.status} ${response.statusText}`)
    console.log()

    const data = await response.json()
    console.log('📦 Response:')
    console.log(JSON.stringify(data, null, 2))
    console.log()

    if (response.ok && data.success) {
      console.log('✅ Login exitoso')
      console.log(`   User: ${data.user.name} (${data.user.email})`)
      console.log(`   Token length: ${data.accessToken?.length || 0}`)
    } else {
      console.log('❌ Login falló')
      console.log(`   Error: ${data.error || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('❌ Network error:', error)
  }
}

main()
