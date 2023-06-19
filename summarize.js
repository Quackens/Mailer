const { Configuration, OpenAIApi } = require("openai")
// const config = require('./config.js')
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
console.log(process.env.API_KEY, process.env.API_ORG)


const configuration = new Configuration ({
    apiKey: process.env.API_KEY,
    organization: process.env.API_ORG
})

const openai = new OpenAIApi(configuration)

const summarizeText = async (title, content) => {
    const chat_completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        temperature: 0.1,
        messages: [
          { 
            role: "system", 
            content: `Summarize the paragraph, knowing that the title of the 
                    text is ${title}. Don't mention the title or have 
                    "The article" in the response `
          },
          { role: "user", content: content},
        ]
    })
    reply = chat_completion.data.choices[0].message.content
    // console.log("openai", reply)
    return reply
}


// Returns array of summaries
const generateSummaries = async (data) => {
    const truncate = data.map(part => ({
        title: part.title, 
        date: part.date, 
        url: part.link, 
        content: part.content
    }))

    for (let i=0; i<truncate.length; i++) {
        const summary = await summarizeText(truncate[i].title, truncate[i].content)
        truncate[i].content = summary
    }
    return truncate    
}

module.exports = {generateSummaries}







