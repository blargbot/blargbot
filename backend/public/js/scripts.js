/**
 * Created by ratismal
 */

function init() {

//    $(".command-list < li a").click(function (e) {
//        alert(e.target);
//    })
    $.fn.scrollView = function () {
        return this.each(function () {
            $('html, body').animate({
                scrollTop: $(this).offset().top
            }, 1000);
        });
    };

    $(document).ready(function () {
        $('.parallax').parallax();
        $(".button-collapse").sideNav({
            edge: 'left',
            closeOnClick: false
        });
        //    $('.collapsible').collapsible({
        //        accordion: true // A setting that changes the collapsible behavior to expandable instead of the default accordion style
        //    });
    });

    $(".sidebar-dropdown").click(function (e) {
        if (e.target['href']) {
            var element = e.target['href'].split('#')[1];
            if (element) {
                $('#' + element).scrollView();
            }
        }
    });
}