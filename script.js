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


// 保存所有照片
let photos = [];


// 保存已经显示过的照片id
let usedPhotos = [];


// 初始化：网页打开时读取一次数据库
async function loadPhotos(){

    const {data,error}=await client
    .from("photos")
    .select("*")


    if(error){

        console.log(error)

        return;

    }


    photos = data;


    console.log(
        "加载照片数量:",
        photos.length
    )

}



loadPhotos();





button.onclick = async ()=>{


    button.innerHTML="Loading..."



    // 防止还没加载完成就点击
    if(photos.length===0){

        button.innerHTML="No Photos"

        return;

    }



    // 如果全部照片都看过了
    // 清空记录，重新开始
    if(
        usedPhotos.length >= photos.length
    ){

        usedPhotos=[];

    }



    // 找出还没显示过的照片

    let availablePhotos =
    photos.filter(
        photo =>
        !usedPhotos.includes(photo.id)
    );



    // 随机选择

    let random =
    availablePhotos[
        Math.floor(
            Math.random()*availablePhotos.length
        )
    ];



    // 记录已经显示

    usedPhotos.push(random.id);



    // 淡出

    image.style.opacity=0;



    setTimeout(()=>{


        image.src=random.url;



        image.onload=()=>{

            image.style.opacity=1;

        }



    },300);



    button.innerHTML="✦ Discover"


}
