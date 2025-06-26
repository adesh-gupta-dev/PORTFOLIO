$(function() {
    // 1) Typed.js for rotating titles
    new Typed('#element', {
      strings: [
        'Adesh Gupta',
        'Web Developer',
        'Programmer',
        'Tech Enthusiast'
      ],
      typeSpeed: 20,
      backSpeed: 25,
      loop: true
    });
    var $html = $("body"),
      $btn = $("#theme-toggle"),
      STORAGE_KEY = "theme";

// 1. On load, apply stored theme:
if (localStorage.getItem(STORAGE_KEY) === 'dark') {
  $html.addClass('dark');
$btn.text('☀️');
}

// 2. Toggle on click:
$btn.on('click', function() {
  var isDark = $html.toggleClass('dark').hasClass('dark');
  localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  $btn.text(isDark ? "☀️ " : "🌙 ");
});

    // 2) Date and year
let year = new Date().getFullYear();
document.getElementById("year").innerHTML = year;
   



    $('#menu-toggle').click(function() {
      $('header nav').stop(true, true).slideToggle(300);
      $('header h1').toggle();
    });
    








    $('header nav a').on('click', function(e) {
      e.preventDefault();
      const target = $($.attr(this, 'href'));
      if (target.length) {
        $('html, body').animate(
          { scrollTop: target.offset().top - $('header').outerHeight() },
          600
        );
      }
    });
  });
  $('#navlist').hover(function() { }, function() {
    $('#navlist').css('background-color', '--highlight-color');
    
  } );
  $('#navlist').on('click', function() {
    $(this).css('background-color', 'rgba(0, 0, 0, 0.5)');  
   });