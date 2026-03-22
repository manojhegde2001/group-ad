
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const boardId = process.argv[2]
  const postId = process.argv[3]
  
  if (!boardId || !postId) {
    console.log('Usage: node test-prisma.js <boardId> <postId>')
    return
  }

  try {
    console.log(`Checking if board ${boardId} and post ${postId} exist...`)
    
    // Test creating a board post
    const boardPost = await prisma.boardPost.create({
      data: {
        board: { connect: { id: boardId } },
        post: { connect: { id: postId } },
      },
    })
    console.log('Success!', boardPost)
  } catch (e) {
    console.error('Error detail:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
