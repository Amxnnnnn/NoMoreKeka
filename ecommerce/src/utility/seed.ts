import { prismaClient } from '../prisma_connection'

const SIGNITY_COMPANY_ID = 'S!gn!ty@#$10234'

export const seedSignityCompany = async () => {
    try {
        console.log('Seeding Signity company...')

        // Check if Signity company already exists
        const existingCompany = await prismaClient.company.findFirst({
            where: { slug: 'signity' }
        })

        if (existingCompany) {
            console.log('Signity company already exists')
            return existingCompany
        }

        // Create Signity company
        const company = await prismaClient.company.create({
            data: {
                id: SIGNITY_COMPANY_ID,
                name: 'Signity Solutions',
                slug: 'signity',
                isActive: true
            }
        })

        console.log('Signity company created successfully:', company.name)
        return company

    } catch (error) {
        console.error('Error seeding Signity company:', error)
        throw error
    }
}

export const getSignityCompanyId = () => SIGNITY_COMPANY_ID