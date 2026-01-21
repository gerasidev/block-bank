import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, '../data/builders.json');

app.use(cors());
app.use(express.json());

// Helper to read data
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data file', err);
        return [];
    }
};

// Helper to write data
const writeData = (data: any) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing data file', err);
    }
};

// API Endpoints
app.get('/api/builders', (req, res) => {
    const builders = readData();
    res.json(builders);
});

app.post('/api/builders', (req, res) => {
    const { name, location, building, category } = req.body;

    // Basic validation
    if (!name || !location || !building || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const builders = readData();

    // Fake geocoding (randomish for demo as requested)
    const newBuilder = {
        id: Math.random().toString(36).substr(2, 9),
        name: name.toUpperCase(),
        location: location.toUpperCase(),
        building: building.toUpperCase(),
        category: category.toUpperCase(),
        coordinates: [
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 100
        ]
    };

    builders.push(newBuilder);
    writeData(builders);

    res.status(201).json(newBuilder);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
