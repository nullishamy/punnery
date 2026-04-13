const $ = document.querySelector.bind(document)

const submitButton = $("#submit")
const nameElement = $("#name")
const outputElement = $("#output")

const previousButton = $("#previous")
const nextButton = $("#next")
const luckyButton = $("#lucky")

const matchesTitle = $("#matchesTitle")

const loadDataPromise = fetch("https://raw.githubusercontent.com/dwyl/english-words/refs/heads/master/words_alpha.txt").then(res => res.text())

const paramsString = window.location.search;
const searchParams = new URLSearchParams(paramsString);

const existingName = searchParams.get("name") ?? ""
nameElement.value = existingName

const existingMatch = parseInt(searchParams.get("match") ?? "0")
searchParams.set("match", existingMatch)

const state = { matches: [], params: searchParams, currentMatch: existingMatch }

function runQuery(query) {
    loadDataPromise.then(wordList => {
        const words = wordList.split("\n")
        for (const word of words) {
            if (word.includes(query)) {
                state.matches.push(word)
            }
        }

        matchesTitle.textContent = `matches (${state.currentMatch} / ${state.matches.length - 1})`

        renderOutput()
    })
}

if (existingName) {
    runQuery(existingName)
}

submitButton.addEventListener("click", (event) => {
    event.preventDefault();

    state.matches = []
    state.currentMatch = 0
    previousButton.disabled = false
    nextButton.disabled = false
    matchesTitle.textContent = "matches"
    
    const query = nameElement.value
    console.log("searching: ", query)

    runQuery(query)
})

nextButton.addEventListener("click", event => {
    event.preventDefault()

    if (state.currentMatch == state.matches.length - 1) {
        nextButton.disabled = true
        return
    }

    state.currentMatch++
    renderOutput()
})

previousButton.addEventListener("click", event => {
    event.preventDefault()

    if (state.currentMatch == 0) {
        previousButton.disabled = true
        return
    }

    nextButton.disabled = false

    state.currentMatch--
    renderOutput()
})

luckyButton.addEventListener("click", event => {
    event.preventDefault()

    nextButton.disabled = false
    previousButton.disabled = false

    state.currentMatch = Math.floor(Math.random() * state.matches.length)

    renderOutput()
})

function fetchAndRenderDefinition(matchElement, word) {
    const apiRoot = "https://api.dictionaryapi.dev/api/v2/entries/en"
    fetch(`${apiRoot}/${word}`).then(res => res.json()).then(res => {
        if (res.title == "No Definitions Found") {
            matchElement.textContent = `no definition found`
            return
        }
        
        if (res.length == 0) {
            matchElement.textContent = `no definition found`
            return
        }
        
        const definition = res[0]
        const meanings = definition.meanings

        if (meanings.length == 0) {
            matchElement.textContent = `no meanings found`
            return
        }

        const meaningDefinitions = meanings[0].definitions
        if (meaningDefinitions.length == 0) {
            matchElement.textContent = `no meanings found`
            return
        }

        const meaning = meaningDefinitions[0]
        console.log(meaning)

        if (meanings.length > 1) {
            matchElement.textContent = `more meanings available: ${meaning.definition}`
        } else {
            matchElement.textContent = meaning.definition
        }

        const links = definition.sourceUrls
        if (links.length > 0) {
            const linkElement = document.createElement("a")
            linkElement.href = links[0]
            linkElement.textContent = "learn more!"
            linkElement.id = "meaningLink"
            matchElement.appendChild(linkElement)           
        }
    })
}

function renderOutput() {
    if (state.matches.length == 0) {
        outputElement.textContent = "no matches :("
        return
    }

    console.log("rendering", state.matches)

    state.params.set("name", nameElement.value)
    state.params.set("match", state.currentMatch)
    
    history.pushState({}, null, "?" + state.params.toString())

    const word = state.matches[state.currentMatch]

    const matchElement = document.createElement("div")
    matchElement.id = "match"
    matchElement.textContent = word
    outputElement.replaceChild(matchElement, outputElement.firstChild)

    const meaningElement = document.createElement("span")
    meaningElement.id = "meaning"
    meaningElement.textContent = "finding meaning..."
    
    fetchAndRenderDefinition(meaningElement, word)
    matchElement.appendChild(meaningElement)

    matchesTitle.textContent = `matches (${state.currentMatch} / ${state.matches.length - 1})`
}
