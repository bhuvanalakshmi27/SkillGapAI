const mongoose = require("mongoose");
const dotenv = require("dotenv");

const CareerRole = require("../models/CareerRole");

dotenv.config();

const careerRoles = [
  {
    title: "Frontend Developer",
    description: "Build accessible, responsive interfaces for web applications.",
    skills: [
      { name: "HTML", requiredLevel: 80, importance: "High" },
      { name: "CSS", requiredLevel: 75, importance: "High" },
      { name: "JavaScript", requiredLevel: 85, importance: "High" },
      { name: "React", requiredLevel: 80, importance: "High" },
      { name: "Git/GitHub", requiredLevel: 70, importance: "Medium" },
      { name: "REST APIs", requiredLevel: 65, importance: "Medium" },
      { name: "Responsive Design", requiredLevel: 75, importance: "High" },
    ],
  },
  {
    title: "Backend Developer",
    description: "Design reliable server-side systems, APIs, and data services.",
    skills: [
      { name: "JavaScript/Node.js", requiredLevel: 80, importance: "High" },
      { name: "Express.js", requiredLevel: 75, importance: "High" },
      { name: "REST APIs", requiredLevel: 85, importance: "High" },
      { name: "Databases", requiredLevel: 80, importance: "High" },
      { name: "Authentication", requiredLevel: 70, importance: "Medium" },
      { name: "Git/GitHub", requiredLevel: 70, importance: "Medium" },
      { name: "Testing", requiredLevel: 65, importance: "Medium" },
    ],
  },
  {
    title: "Full Stack Developer",
    description: "Deliver complete web products across frontend and backend systems.",
    skills: [
      { name: "HTML/CSS", requiredLevel: 75, importance: "High" },
      { name: "JavaScript", requiredLevel: 85, importance: "High" },
      { name: "React", requiredLevel: 75, importance: "High" },
      { name: "Node.js", requiredLevel: 75, importance: "High" },
      { name: "REST APIs", requiredLevel: 80, importance: "High" },
      { name: "Databases", requiredLevel: 75, importance: "High" },
      { name: "Git/GitHub", requiredLevel: 75, importance: "Medium" },
    ],
  },
  {
    title: "Python Developer",
    description: "Create automation, services, and applications with Python.",
    skills: [
      { name: "Python", requiredLevel: 85, importance: "High" },
      { name: "Object-Oriented Programming", requiredLevel: 75, importance: "High" },
      { name: "Data Structures", requiredLevel: 75, importance: "High" },
      { name: "REST APIs", requiredLevel: 70, importance: "Medium" },
      { name: "SQL", requiredLevel: 70, importance: "Medium" },
      { name: "Testing", requiredLevel: 65, importance: "Medium" },
      { name: "Git/GitHub", requiredLevel: 65, importance: "Low" },
    ],
  },
  {
    title: "Java Developer",
    description: "Build maintainable enterprise and backend applications with Java.",
    skills: [
      { name: "Java", requiredLevel: 85, importance: "High" },
      { name: "Object-Oriented Programming", requiredLevel: 80, importance: "High" },
      { name: "Spring Boot", requiredLevel: 75, importance: "High" },
      { name: "REST APIs", requiredLevel: 75, importance: "High" },
      { name: "SQL", requiredLevel: 70, importance: "Medium" },
      { name: "Data Structures", requiredLevel: 75, importance: "Medium" },
      { name: "Git/GitHub", requiredLevel: 65, importance: "Low" },
    ],
  },
  {
    title: "Data Analyst",
    description: "Turn structured data into clear insights for better decisions.",
    skills: [
      { name: "Excel", requiredLevel: 80, importance: "High" },
      { name: "SQL", requiredLevel: 85, importance: "High" },
      { name: "Python", requiredLevel: 70, importance: "Medium" },
      { name: "Data Visualization", requiredLevel: 80, importance: "High" },
      { name: "Statistics", requiredLevel: 75, importance: "High" },
      { name: "Power BI/Tableau", requiredLevel: 70, importance: "Medium" },
      { name: "Data Cleaning", requiredLevel: 75, importance: "High" },
    ],
  },
  {
    title: "DevOps Engineer",
    description: "Automate delivery and improve the reliability of software systems.",
    skills: [
      { name: "Linux", requiredLevel: 80, importance: "High" },
      { name: "Git/GitHub", requiredLevel: 80, importance: "High" },
      { name: "CI/CD", requiredLevel: 85, importance: "High" },
      { name: "Docker", requiredLevel: 80, importance: "High" },
      { name: "Kubernetes", requiredLevel: 65, importance: "Medium" },
      { name: "Cloud Platforms", requiredLevel: 75, importance: "High" },
      { name: "Monitoring", requiredLevel: 65, importance: "Medium" },
    ],
  },
  {
    title: "Cloud Engineer",
    description: "Design and operate secure, scalable cloud infrastructure.",
    skills: [
      { name: "Cloud Platforms", requiredLevel: 85, importance: "High" },
      { name: "Linux", requiredLevel: 75, importance: "High" },
      { name: "Networking", requiredLevel: 75, importance: "High" },
      { name: "Infrastructure as Code", requiredLevel: 70, importance: "Medium" },
      { name: "Docker", requiredLevel: 70, importance: "Medium" },
      { name: "Security Basics", requiredLevel: 70, importance: "High" },
      { name: "Monitoring", requiredLevel: 65, importance: "Medium" },
    ],
  },
  {
    title: "Cybersecurity Analyst",
    description: "Monitor systems, investigate threats, and strengthen security controls.",
    skills: [
      { name: "Networking", requiredLevel: 80, importance: "High" },
      { name: "Linux", requiredLevel: 75, importance: "High" },
      { name: "Security Fundamentals", requiredLevel: 85, importance: "High" },
      { name: "Threat Analysis", requiredLevel: 75, importance: "High" },
      { name: "SIEM Tools", requiredLevel: 65, importance: "Medium" },
      { name: "Incident Response", requiredLevel: 70, importance: "High" },
      { name: "Scripting", requiredLevel: 65, importance: "Medium" },
    ],
  },
];

async function seedCareerRoles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to database: ${mongoose.connection.name}`);

    await CareerRole.bulkWrite(
      careerRoles.map((careerRole) => ({
        updateOne: {
          filter: { title: careerRole.title },
          update: { $set: careerRole },
          upsert: true,
        },
      }))
    );

    const count = await CareerRole.countDocuments();
    console.log(`Career roles in database: ${count}`);
  } catch (error) {
    console.error("Career role seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedCareerRoles();
