// Test Users Setup Script
// Creates test accounts for local multi-user testing

const { sequelize, User, Case } = require('./models');

async function setupTestEnvironment() {
    console.log('=== Setting up Test Environment ===\n');

    try {
        // Sync database
        console.log('Syncing database...');
        await sequelize.sync({ alter: true });
        console.log('✓ Database synced\n');

        // Check if test users already exist
        const existingOffender = await User.findOne({ where: { email: 'offender@test.com' } });
        const existingVictim = await User.findOne({ where: { email: 'victim@test.com' } });

        // Create offender account
        if (!existingOffender) {
            console.log('Creating offender test account...');
            const offender = await User.create({
                email: 'offender@test.com',
                password: 'test1234',
                name: '테스트_가해자',
                phone: '010-1111-1111',
                role: 'offender'
            });
            console.log('✓ Offender account created');
            console.log(`  Email: offender@test.com`);
            console.log(`  Password: test1234`);
            console.log(`  ID: ${offender.id}\n`);
        } else {
            console.log('✓ Offender account already exists');
            console.log(`  Email: offender@test.com`);
            console.log(`  ID: ${existingOffender.id}\n`);
        }

        // Create victim account
        if (!existingVictim) {
            console.log('Creating victim test account...');
            const victim = await User.create({
                email: 'victim@test.com',
                password: 'test1234',
                name: '테스트_피해자',
                phone: '010-2222-2222',
                role: 'victim'
            });
            console.log('✓ Victim account created');
            console.log(`  Email: victim@test.com`);
            console.log(`  Password: test1234`);
            console.log(`  ID: ${victim.id}\n`);
        } else {
            console.log('✓ Victim account already exists');
            console.log(`  Email: victim@test.com`);
            console.log(`  ID: ${existingVictim.id}\n`);
        }

        // Optionally create a test case
        const createCase = process.argv.includes('--with-case');
        if (createCase) {
            const offender = existingOffender || await User.findOne({ where: { email: 'offender@test.com' } });
            const victim = existingVictim || await User.findOne({ where: { email: 'victim@test.com' } });

            console.log('Creating test case...');
            const testCase = await Case.create({
                offenderId: offender.id,
                victimId: victim.id,
                inviteCode: 'TEST123',
                status: 'active',
                incidentDate: new Date('2024-01-15'),
                incidentLocation: '서울시 강남구',
                incidentDescription: '테스트용 사건입니다.',
                damageAmount: 1000000
            });
            console.log('✓ Test case created');
            console.log(`  Case ID: ${testCase.id}`);
            console.log(`  Invite Code: TEST123\n`);
        }

        console.log('=== Setup Complete! ===\n');
        console.log('Test Accounts:');
        console.log('  Offender: offender@test.com / test1234');
        console.log('  Victim: victim@test.com / test1234\n');

        if (createCase) {
            console.log('Test Case:');
            console.log('  Invite Code: TEST123\n');
        }

        console.log('You can now start testing with:');
        console.log('  npm start\n');
        console.log('Or use the quick launcher:');
        console.log('  powershell -ExecutionPolicy Bypass -File .\\start_local_test.ps1\n');

    } catch (error) {
        console.error('Error setting up test environment:', error);
        console.error('\nDetails:', error.message);
    } finally {
        await sequelize.close();
    }
}

// Run setup
setupTestEnvironment();
