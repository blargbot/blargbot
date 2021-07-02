/**
 * Created by ratismal
 */

(function(i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function() {
        (i[r].q = i[r].q || []).push(arguments);
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-28511548-7', 'auto');
ga('send', 'pageview');



function init() {

    //    $(".command-list < li a").click(function (e) {
    //        alert(e.target);
    //    })
    $.fn.scrollView = function() {
        return this.each(function() {
            $('html, body').animate({
                scrollTop: $(this).offset().top
            }, 1000);
        });
    };

    $(document).ready(function() {
        $('.parallax').parallax();
        $(".button-collapse").sideNav({
            edge: 'left',
            closeOnClick: false
        });
        //    $('.collapsible').collapsible({
        //        accordion: true // A setting that changes the collapsible behavior to expandable instead of the default accordion style
        //    });
    });

    $(".sidebar-dropdown").click(function(e) {
        if (e.target['href']) {
            var element = e.target['href'].split('#')[1];
            if (element) {
                $('#' + element).scrollView();
            }
        }
    });
}