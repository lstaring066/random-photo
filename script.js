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

let lastPhoto = null;


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



let random;


do {

random =
data[
Math.floor(
Math.random()*data.length
)
];


} while(
data.length > 1 &&
random.id === lastPhoto
);


lastPhoto = random.id;


image.style.opacity=0;


setTimeout(()=>{

image.src=random.url;

image.onload=()=>{

image.style.opacity=1;

}

},500)



button.innerHTML="✦ Discover"


}
