const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));
// Database connection
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root', // Replace with your MySQL username
    password: 'root', // Replace with your MySQL password
    database: 'test',
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Routes

app.get('/', (req, res) => {
    const query = 'SELECT * FROM student';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching records:', err.message);
            return res.render("index", { student: [], search_results: [], message: null });
        }

        //const no_results = results.length === 0;

        res.render('index', {
            student: results, // All student records
            search_results: [], // No search results for the default page
            message: null, // No message for the default page
            no_result : false,
        });
    });
});


app.get('/search', (req, res) => {
    const search_name = req.query.search_name;
    const query = 'SELECT * FROM student WHERE name LIKE ?';
    const search_term = `%${search_name}%`;

    // Perform the query
    db.query(query, [search_term], (err, results) => {
        if (err) {
            console.error('Error fetching records:', err.message);
            return res.status(500).send('Internal Server Error');
        }

        const no_results = results.length === 0;  // Determine if no results found
        console.log('No results:', no_results);

        res.render('index', {
            student: [],  // No student records displayed in the table
            search_results: results,  // Pass search results
            message: null,  // Show message if no results
            no_result: no_results,  // Show if no search results found
        });
    });
});



// app.post('/search', (req, res) => {
//     const { search_query} = req.body;
//     const query = 'SELECT * FROM student WHERE name LIKE ? or email LIKE ?';
//     const search_term =  `%${search_query}`;

//     db.query(query, [search_term, search_term], (err, results) => {
//         if (err){
//             console.error('Error searching for student: ', err.message);
//             return res.status(500).json({ error: 'Internal Server Error' });
//         }

//         if (results.length > 0){
//             res.json({ students: results });
//         } else {
//             res.json({ students: [], message: 'No students matched'});
//         }
//     });
// });

// Add a new user
// Add a new user
app.post('/add', (req, res) => {
    const { name, year, course, email } = req.body;
    const query_check = 'SELECT * FROM student WHERE email = ? ';
    const query_insert = 'INSERT INTO student (name, year, course, email) VALUES (?, ?, ?, ?)';

    // Check if student already exists
    db.query(query_check, [email], (err, results) => {
        if (err) {
            console.error('Error checking for existing student:', err.message);
            return res.render("index", { student: [], search_results: [], error: "Failed to add student" });
        }

        if (results.length > 0) {
            // Student already exists
            return res.render('index', {
                student: [], // Pass the main student data if needed
                search_results: [], // No search results
                message: 'Student with this email already exists.', // Error message
                no_result: false // No search results
            });
        }

        // Insert the new student
        db.query(query_insert, [name, year, course, email], (err) => {
            if (err) {
                console.error('Error inserting student:', err.message);
                return res.render("index", { student: [], search_results: [], error: "Failed to add student" });
            }

            // Redirect back to the main page after successful addition
            res.redirect('/');
        });
    });
});



// Update user
app.post('/update/:id', (req, res) => {
    const { id } = req.params;
    const { name, year, course, email } = req.body;
    const query = 'UPDATE student SET name = ?, year = ?, course = ?, email = ? WHERE id = ?';
    db.query(query, [name, year, course, email, id], (err) => {
        if (err) {
            console.error('Error updating record:', err.message);
            res.render('index', { student: [], error: err.message, search_results: [] });
        } else {
            res.redirect('/');
        }
    });
});

// Delete user
app.post('/delete/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM student WHERE id = ?';
    db.query(query, [id], (err) => {
        if (err) {
            console.error('Error deleting record:', err.message);
            res.render('index', { error: err.message , search_results: []});
        } else {
            res.redirect('/');
        }
    });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
