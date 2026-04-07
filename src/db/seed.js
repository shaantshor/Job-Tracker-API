require('dotenv').config();

const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear existing data
    await client.query('DELETE FROM timeline_events');
    await client.query('DELETE FROM contacts');
    await client.query('DELETE FROM applications');
    await client.query('DELETE FROM users');

    // Seed demo user
    const passwordHash = await bcrypt.hash('password123', 12);
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
      ['demo@example.com', passwordHash, 'Demo User'],
    );
    const userId = userResult.rows[0].id;

    // Seed applications
    const applications = [
      { company: 'Google', role: 'Backend Engineer', url: 'https://careers.google.com/jobs/backend-engineer', status: 'interviewing', salary_min: 65000, salary_max: 85000, location: 'London', remote_type: 'hybrid', visa_sponsorship: true, applied_date: '2026-03-15', response_date: '2026-03-22', priority: 'high' },
      { company: 'Wise', role: 'Full-Stack Developer', url: 'https://wise.jobs/full-stack-developer', status: 'applied', salary_min: 55000, salary_max: 75000, location: 'London', remote_type: 'hybrid', visa_sponsorship: true, applied_date: '2026-03-20', priority: 'high' },
      { company: 'Revolut', role: 'Backend Engineer', url: 'https://revolut.com/careers/backend-engineer', status: 'screening', salary_min: 60000, salary_max: 80000, location: 'London', remote_type: 'onsite', visa_sponsorship: true, applied_date: '2026-03-18', response_date: '2026-03-25', priority: 'high' },
      { company: 'Monzo', role: 'Software Engineer', url: 'https://monzo.com/careers/software-engineer', status: 'rejected', salary_min: 50000, salary_max: 70000, location: 'London', remote_type: 'hybrid', visa_sponsorship: false, applied_date: '2026-03-01', response_date: '2026-03-15', priority: 'medium' },
      { company: 'Deliveroo', role: 'Backend Developer', url: 'https://careers.deliveroo.co.uk/backend-developer', status: 'offer', salary_min: 55000, salary_max: 72000, location: 'London', remote_type: 'hybrid', visa_sponsorship: true, applied_date: '2026-02-20', response_date: '2026-03-10', priority: 'high' },
      { company: 'Arm', role: 'Graduate SWE', url: 'https://arm.com/careers/graduate-swe', status: 'applied', salary_min: 35000, salary_max: 45000, location: 'Cambridge', remote_type: 'onsite', visa_sponsorship: true, applied_date: '2026-03-25', priority: 'medium' },
      { company: 'Sky', role: 'Backend Engineer', url: 'https://careers.sky.com/backend-engineer', status: 'wishlist', salary_min: 45000, salary_max: 60000, location: 'Osterley', remote_type: 'hybrid', visa_sponsorship: false, priority: 'low' },
      { company: 'BBC', role: 'Software Developer', url: 'https://careers.bbc.co.uk/software-developer', status: 'applied', salary_min: 40000, salary_max: 55000, location: 'Manchester', remote_type: 'hybrid', visa_sponsorship: true, applied_date: '2026-03-22', priority: 'medium' },
      { company: 'ThoughtWorks', role: 'Graduate Developer', url: 'https://thoughtworks.com/careers/graduate-developer', status: 'interviewing', salary_min: 35000, salary_max: 45000, location: 'London', remote_type: 'hybrid', visa_sponsorship: true, applied_date: '2026-03-10', response_date: '2026-03-17', priority: 'medium' },
      { company: 'Spotify', role: 'Backend Engineer', url: 'https://jobs.lever.co/spotify/backend-engineer', status: 'screening', salary_min: 60000, salary_max: 80000, location: 'London', remote_type: 'remote', visa_sponsorship: true, applied_date: '2026-03-19', response_date: '2026-03-26', priority: 'high' },
      { company: 'Skyscanner', role: 'Full-Stack Developer', url: 'https://skyscanner.net/jobs/full-stack', status: 'applied', salary_min: 45000, salary_max: 65000, location: 'Edinburgh', remote_type: 'hybrid', visa_sponsorship: false, applied_date: '2026-03-23', priority: 'medium' },
      { company: 'Starling Bank', role: 'Backend Engineer', url: 'https://starlingbank.com/careers/backend', status: 'withdrawn', salary_min: 50000, salary_max: 68000, location: 'London', remote_type: 'hybrid', visa_sponsorship: false, applied_date: '2026-02-28', response_date: '2026-03-05', priority: 'low' },
      { company: 'Ocado Technology', role: 'Software Engineer', url: 'https://ocadogroup.com/careers/software-engineer', status: 'wishlist', salary_min: 45000, salary_max: 60000, location: 'Hatfield', remote_type: 'onsite', visa_sponsorship: true, priority: 'low' },
      { company: 'Canva', role: 'Backend Developer', url: 'https://canva.com/careers/backend-developer', status: 'applied', salary_min: 55000, salary_max: 75000, location: 'Remote', remote_type: 'remote', visa_sponsorship: false, applied_date: '2026-03-24', priority: 'medium' },
      { company: 'Goldman Sachs', role: 'Software Engineer', url: 'https://goldmansachs.com/careers/software-engineer', status: 'interviewing', salary_min: 60000, salary_max: 85000, location: 'London', remote_type: 'onsite', visa_sponsorship: true, applied_date: '2026-03-05', response_date: '2026-03-12', priority: 'high' },
      { company: 'Meta', role: 'Backend Engineer', url: 'https://metacareers.com/backend-engineer', status: 'accepted', salary_min: 70000, salary_max: 95000, location: 'London', remote_type: 'hybrid', visa_sponsorship: true, applied_date: '2026-02-10', response_date: '2026-03-01', priority: 'high' },
      { company: 'Tesco Technology', role: 'Graduate Developer', url: 'https://tesco-careers.com/graduate-developer', status: 'applied', salary_min: 30000, salary_max: 38000, location: 'Welwyn Garden City', remote_type: 'hybrid', visa_sponsorship: false, applied_date: '2026-03-26', priority: 'low' },
      { company: 'Checkout.com', role: 'Backend Engineer', url: 'https://checkout.com/careers/backend-engineer', status: 'screening', salary_min: 55000, salary_max: 75000, location: 'London', remote_type: 'hybrid', visa_sponsorship: true, applied_date: '2026-03-21', response_date: '2026-03-28', priority: 'high' },
    ];

    const appIds = [];
    for (const app of applications) {
      const result = await client.query(
        `INSERT INTO applications (user_id, company, role, url, status, salary_min, salary_max, currency, location, remote_type, visa_sponsorship, applied_date, response_date, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'GBP', $8, $9, $10, $11, $12, $13) RETURNING id`,
        [userId, app.company, app.role, app.url, app.status, app.salary_min, app.salary_max, app.location, app.remote_type, app.visa_sponsorship, app.applied_date || null, app.response_date || null, app.priority],
      );
      appIds.push({ id: result.rows[0].id, ...app });
    }

    // Seed contacts (2-3 per application for first 10)
    const contactData = [
      { name: 'Sarah Chen', role: 'Engineering Manager', email: 'sarah.chen@google.com', linkedin_url: 'https://linkedin.com/in/sarahchen' },
      { name: 'James Wright', role: 'Senior Recruiter', email: 'james.wright@google.com', linkedin_url: 'https://linkedin.com/in/jameswright' },
      { name: 'Anna Kowalski', role: 'Tech Lead', email: 'anna.k@wise.com', linkedin_url: 'https://linkedin.com/in/annakowalski' },
      { name: 'Tom Harris', role: 'HR Partner', email: 'tom.harris@wise.com', linkedin_url: 'https://linkedin.com/in/tomharris' },
      { name: 'Priya Sharma', role: 'VP Engineering', email: 'priya.s@revolut.com', linkedin_url: 'https://linkedin.com/in/priyasharma' },
      { name: 'David Kim', role: 'Recruiter', email: 'david.kim@revolut.com', linkedin_url: 'https://linkedin.com/in/davidkim' },
      { name: 'Laura Thompson', role: 'Recruiter', email: 'laura.t@revolut.com' },
      { name: 'Mike Johnson', role: 'Engineering Lead', email: 'mike.j@monzo.com', linkedin_url: 'https://linkedin.com/in/mikejohnson' },
      { name: 'Emily Davis', role: 'Talent Acquisition', email: 'emily.d@monzo.com' },
      { name: 'Chris Martin', role: 'CTO', email: 'chris.m@deliveroo.co.uk', linkedin_url: 'https://linkedin.com/in/chrismartin' },
      { name: 'Sophie Brown', role: 'Senior Recruiter', email: 'sophie.b@deliveroo.co.uk', linkedin_url: 'https://linkedin.com/in/sophiebrown' },
      { name: 'Alex Taylor', role: 'Tech Lead', email: 'alex.t@deliveroo.co.uk' },
      { name: 'Rachel Green', role: 'HR Manager', email: 'rachel.g@arm.com', linkedin_url: 'https://linkedin.com/in/rachelgreen' },
      { name: 'Ollie Walsh', role: 'Recruiter', email: 'ollie.w@arm.com' },
      { name: 'Hannah White', role: 'Engineering Manager', email: 'hannah.w@sky.com', linkedin_url: 'https://linkedin.com/in/hannahwhite' },
      { name: 'Ben Carter', role: 'Recruiter', email: 'ben.c@sky.com' },
      { name: 'Fatima Al-Hassan', role: 'Tech Lead', email: 'fatima.a@bbc.co.uk', linkedin_url: 'https://linkedin.com/in/fatimaalhassan' },
      { name: 'Nisha Patel', role: 'Senior Recruiter', email: 'nisha.p@bbc.co.uk' },
      { name: 'Marcus Lee', role: 'Talent Partner', email: 'marcus.l@thoughtworks.com', linkedin_url: 'https://linkedin.com/in/marcuslee' },
      { name: 'Zara Ahmed', role: 'Engineering Lead', email: 'zara.a@thoughtworks.com' },
      { name: 'Oliver Stone', role: 'Recruiter', email: 'oliver.s@spotify.com', linkedin_url: 'https://linkedin.com/in/oliverstone' },
      { name: 'Chloe Evans', role: 'Engineering Manager', email: 'chloe.e@spotify.com' },
    ];

    let contactIndex = 0;
    for (let i = 0; i < Math.min(10, appIds.length); i += 1) {
      const contactCount = i % 3 === 0 ? 3 : 2;
      for (let j = 0; j < contactCount && contactIndex < contactData.length; j += 1) {
        const c = contactData[contactIndex];
        await client.query(
          'INSERT INTO contacts (application_id, name, role, email, linkedin_url) VALUES ($1, $2, $3, $4, $5)',
          [appIds[i].id, c.name, c.role, c.email, c.linkedin_url || null],
        );
        contactIndex += 1;
      }
    }

    // Seed timeline events
    const statusProgression = {
      interviewing: ['created', 'status_change:wishlist→applied', 'status_change:applied→screening', 'status_change:screening→interviewing'],
      applied: ['created', 'status_change:wishlist→applied'],
      screening: ['created', 'status_change:wishlist→applied', 'status_change:applied→screening'],
      rejected: ['created', 'status_change:wishlist→applied', 'status_change:applied→screening', 'status_change:screening→rejected'],
      offer: ['created', 'status_change:wishlist→applied', 'status_change:applied→screening', 'status_change:screening→interviewing', 'status_change:interviewing→offer'],
      accepted: ['created', 'status_change:wishlist→applied', 'status_change:applied→screening', 'status_change:screening→interviewing', 'status_change:interviewing→offer', 'status_change:offer→accepted'],
      withdrawn: ['created', 'status_change:wishlist→applied', 'status_change:applied→withdrawn'],
      wishlist: ['created'],
    };

    for (const app of appIds) {
      const events = statusProgression[app.status] || ['created'];
      const baseDate = new Date(app.applied_date || '2026-03-20');

      for (let i = 0; i < events.length; i += 1) {
        const event = events[i];
        const eventDate = new Date(baseDate);
        eventDate.setDate(eventDate.getDate() + (i * 3));

        let eventType;
        let description;
        if (event === 'created') {
          eventType = 'created';
          description = `Application created for ${app.company} — ${app.role}`;
        } else {
          eventType = 'status_change';
          const transition = event.split(':')[1];
          description = `Status changed from ${transition.replace('→', ' to ')}`;
        }

        await client.query(
          'INSERT INTO timeline_events (application_id, event_type, description, event_date) VALUES ($1, $2, $3, $4)',
          [app.id, eventType, description, eventDate],
        );
      }
    }

    await client.query('COMMIT');
    console.log('Seed completed successfully');
    console.log(`Created: 1 user, ${appIds.length} applications, ${contactIndex} contacts`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
