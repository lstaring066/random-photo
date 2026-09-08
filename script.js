const supabaseUrl =
"https://nrpedfcezmvrrjhhfihy.supabase.co"


const supabaseKey =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycGVkZmNlem12cnJqaGhmaWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MjkyMTEsImV4cCI6MjEwNDQwNTIxMX0.n1f7yX3FaxWMm4IcBNfgclAiGs07vi-eDlJc5JKMrJA"



const client =
supabase.createClient(
supabaseUrl,
supabaseKey
)



const button =
document.getElementById("btn")


const image =
document.getElementById("photo")



button.onclick = async ()=>{


button.innerHTML="Loading..."



let {data,error}=await client
.from("photos")
.select("*")



if(error){

console.log(error)

return

}



let random =
data[
Math.floor(
Math.random()*data.length
)
]



image.classList.remove("show")


setTimeout(()=>{


image.src=random.url


image.classList.add("show")


},100)



button.innerHTML="✦ Discover"


}
