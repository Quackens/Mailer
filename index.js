const express = require('express')
const mail = require('./makeMail.js')
const summarize = require('./summarize.js')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const cors = require('cors')
const Parser = require('rss-parser')


const PORT = process.env.PORT || 5000

const RSS_SOURCE = 'http://connect.biorxiv.org/biorxiv_xml.php?subject=all'
const app = express()

app.use(cors())
app.use(express.json())

const parser = new Parser({
    customFields: {
        item: ["dc:identifier"],
    }
})

// Pulls XML data from RSS feed
const pullItems = async () => {
    const feed = await parser.parseURL(RSS_SOURCE)
    return feed.items
}

// Parse items retrieved from XML data
const parseItems = (items) => {
    const doiToID = (doi) => {
        return Number(doi.split('.').slice(-1))
    }
    let info = []
    items.forEach(item => info.push({id: doiToID(item["dc:identifier"]), doi: item["dc:identifier"], date: item["date"]}))

    return info
}

// Gets latest doi id's
const getLatest = (info, items) => {
    const compareFn = (a, b) => {
        const diff = new Date(b.date) - new Date(a.date)
        if (diff) return diff
        else {
            return b.id - a.id
        }
    }
    info = info.sort(compareFn)
    const latest5 = info.slice(0, 5)
    const latestDoi = latest5.map(item => item.doi)


    const findFn = (item) => {
        for (let i=0; i < latestDoi.length; i++) {
            if (latestDoi[i] === item['dc:identifier']) {
                return true
            }
        }
        return false
    }
    const latestFull = items.filter(findFn)
    return latestFull
}

// Determines if data needs udpate, returns true if updates 'data', else false
const updateData = (newData) => {
    latestUpdateTime = new Date()
    const parsedNew = parseItems(newData).map(item => item.id)

    const needUpdate = latestIDs === [] || 
        !parsedNew.reduce(((acc, curr) => acc && latestIDs.includes(curr)), true)
    
    if (needUpdate) {
        console.log('Updating...')
        data = newData
        latestIDs = parsedNew
        return true
    } else {
        console.log('No need for update')
        return false
    }
}



const main = async () => {
    const items = await pullItems()
    const info = parseItems(items)
    const latest = getLatest(info, items)

    const updated = updateData(latest)
    
    summarize.generateSummaries(data).then(summary => {
        // console.log(summary)
        
        if (updated) {
            // Create email containing the latest articles
            const {text, html} = mail.generateContent(summary)
            const {transporter, mailData} = mail.createMail(mail.texts.updateSubject, 
                                                    text.join(''), html.join(''))
            mail.sendMail(transporter, mailData)
            emailContents = mailData.html
        } else {
            // Create email notifying of no updates
            const {transporter, mailData} = mail.createMail(mail.texts.noUpdateSubject,
                                mail.texts.noUpdateText, mail.texts.noUpdateHTML)
            mail.sendMail(transporter, mailData)
            emailContents = mailData.html
        }
        console.log("Mail Sent!")
    })
}


let data = [] // Contains Information about the latest 5 items
let latestIDs = [] // Contains the last 5 IDs
let latestUpdateTime = new Date()
let emailContents = ''

const mainRunner = () => {
    main()
    setInterval(main, 3600000)
}

mainRunner()

/**
 * Fields:
 * <h2> Title </h2>
 * <br>Date</br>
 * <a href="url"> See more here</a>
 * <p> Content (summarized) <p>
 * 
 */

app.get("", (req, res) => {
    res.send (
        `<h2> Server is live</h3> 
        <p>Last Update: ${latestUpdateTime}</p> 
        <p> Emailing from: ${process.env.MAIL_ADDR}</p>`
        + '<h2> Latest Email Contents: </h3>'
        + emailContents
        )
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})







