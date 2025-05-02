let nav = document.querySelector(".topBar h1");
let sideBar = document.querySelector(".sideBar")

nav.addEventListener("click", function(){
    console.log("clicked");
    sideBar.classList.toggle("hidden");
})