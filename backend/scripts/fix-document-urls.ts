import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BACKEND_URL = 'http://localhost:3001'

async function fixDocumentUrls() {
  console.log('Fixing document URLs...')
  
  // Get all documents with relative URLs
  const documents = await prisma.document.findMany({
    where: {
      fileUrl: {
        startsWith: '/uploads/'
      }
    }
  })
  
  console.log(`Found ${documents.length} documents with relative URLs`)
  
  for (const doc of documents) {
    const newUrl = `${BACKEND_URL}${doc.fileUrl}`
    console.log(`Updating document ${doc.id}: ${doc.fileUrl} -> ${newUrl}`)
    
    await prisma.document.update({
      where: { id: doc.id },
      data: { fileUrl: newUrl }
    })
  }
  
  console.log('Done!')
  await prisma.$disconnect()
}

fixDocumentUrls().catch(console.error)
