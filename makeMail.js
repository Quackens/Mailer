// const config = require('./config.js')
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
console.log(process.env.MAIL_ADDR, process.env.MAIL_PASS)
const nodemailer = require('nodemailer')

const createMail = (subject, text, html) => {
    const transporter = nodemailer.createTransport({
        port: 465,
        host: "smtp.gmail.com",
        auth: {
            user: process.env.MAIL_ADDR,
            pass: process.env.MAIL_PASS
        },
        secure: true
    })

    const mailData = {
        from: 'witherdome@gmail.com',
        to: 'captain.jims@hotmail.com',
        subject: subject,
        text: text,
        html: html
    }
    return {transporter, mailData}
}

const sendMail = (transporter, mailData) => {
    transporter.sendMail(mailData, (error, info) => {
        if (error) {
            return //console.log(error)
        }
        else {
            //console.log(info)
        }
    })
}

const generateContent = (useData) => {
    const text = useData.map(part => ({
        title: part.title, 
        date: part.date, 
        url: part.link, 
        content: part.content
    }))
    const html = text.map(comp => 
        `
        <h2> ${comp.title} </h2>
        <br>${comp.date}</br>
        <a href=${comp.url}> See more here</a>
        <p> ${comp.content} (summarized) <p>
        `)
    return {text, html}
}

const noUpdateText = 'No updates since the last digest. All clear!'
const noUpdateHTML = '<p>No updates since the last digest. All clear!</p>'
const updateSubject = `Hourly Digest (${new Date()}): Updates`
const noUpdateSubject = `Hourly Digest (${new Date()}): No Updates`

module.exports = {
    createMail, sendMail, generateContent,
    texts: {noUpdateText, noUpdateHTML, updateSubject, noUpdateSubject}
}



