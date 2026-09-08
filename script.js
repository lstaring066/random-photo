const supabaseUrl =
"https://nrpedfcezmvrrjhhfihy.supabase.co"


const supabaseKey =
"sb_publishable_M9eL0D5OIW_NpOYkm8NaLw_d-o7bKHA"


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


const {data,error}=await client
.from("photos")
.select("*")



if(error){

console.log(error)

button.innerHTML="Error"

return

}



console.log(data)



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
