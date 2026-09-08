console.log("开始");
const supabaseUrl =
"https://nrpedfcezmvrrjhhfihy.supabase.co"


const supabaseKey =
"你的anon key"



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
