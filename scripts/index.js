const TIERS = ["S","A","B","C","D","E","F","Pas joué"]


function makeTierSection(rank)
{
const wrap = document.createElement("section")
wrap.className = "tier"


const head = document.createElement("div")
head.className = "tier-head"


const badge = document.createElement("div")
badge.className = "tier-badge"
badge.textContent = rank === "Pas joué" ? "?" : rank


const title = document.createElement("div")
title.className = "tier-title"
title.textContent = rank === "Pas joué" ? "Pas joué" : `Rang ${rank}`


head.appendChild(badge)
head.appendChild(title)


const grid = document.createElement("div")
grid.className = "tier-grid"
grid.dataset.rank = rank


wrap.appendChild(head)
wrap.appendChild(grid)
return wrap
}


function cardFor(game)
{
const a = document.createElement("a")
a.href = `detail.html?id=${encodeURIComponent(game.id)}`
a.className = "card"


const img = document.createElement("img")
img.loading = "lazy"
img.alt = game.title
img.src = game.image
img.onerror = () => img.style.visibility = "hidden"


const t = document.createElement("div")
t.className = "card-title"
t.textContent = game.title


a.appendChild(img)
a.appendChild(t)
return a
}


async function main()
{
const res = await fetch("./data/games.json", { cache: "no-store" })
const data = await res.json()


const tiersRoot = document.getElementById("tiers")
TIERS.forEach(rank => tiersRoot.appendChild(makeTierSection(rank)))


Object.values(data).forEach(game =>
{
const r = game.rank || "Pas joué"
const grid = document.querySelector(`.tier-grid[data-rank="${r}"]`)
if (!grid) return
grid.appendChild(cardFor(game))
})
}


document.addEventListener("DOMContentLoaded", main)