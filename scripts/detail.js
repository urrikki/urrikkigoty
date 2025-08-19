function qs(key)
{
    const u = new URL(location.href)
    return u.searchParams.get(key)
}


async function main()
{
    const id = qs("id")
    const res = await fetch("./data/games.json", { cache: "no-store" })
    const data = await res.json()
    const g = data[id]
    const root = document.getElementById("game-detail")
    if (!g)
    {
        root.textContent = "Jeu introuvable."
        return
}


const img = document.createElement("img")
img.src = g.image
img.alt = g.title


const meta = document.createElement("div")
meta.className = "game-meta"


const h2 = document.createElement("h2")
h2.textContent = g.title


const rank = document.createElement("div")
rank.textContent = `Rang : ${g.rank || "Pas joué"}`


const review = document.createElement("div")
review.className = "review"
review.textContent = g.review || ""


meta.appendChild(h2)
meta.appendChild(rank)
meta.appendChild(review)


root.appendChild(img)
root.appendChild(meta)
}


document.addEventListener("DOMContentLoaded", main)