/**
 * spa.js - SPA router for Pseudogenomes App.
 *
 * Authors:
 *    Joffrey Fitz (joffrey.fitz@tuebingen.mpg.de)
 * 
 * Copyright (c) 2015-2018 Max Planck Institute for Developmental 
 *    Biology, Tübingen, Germany, http://www.eb.tuebingen.mpg.de
 * 
 * This file is part of Pseudogenomes Frontend.
 *   
 * Pseudogenomes Frontend is free software: you can redistribute it 
 * and/or modify it under the terms of the GNU General Public License 
 * as published by the Free Software Foundation, either version 3 of 
 * the License, or (at your option) any later version.
 *
 * Pseudogenomes Frontend is distributed in the hope that it will be 
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Pseudogenomes Frontend.  
 * If not, see <https://www.gnu.org/licenses/>.
 */

var mode;

$(function () {
    'use strict';

    $(window).on('hashchange', function() {

        render(window.location.hash);
    });

    $(window).on('load', function(){

        render(window.location.hash);
    });

    function render(url) {

        // Get the keyword from the url.
        var temp = url.split('/')[0];

        // Hide whatever page is currently shown.
        $('.page').addClass('invisible');

        // Clear active navigation links
        $('.navigation_link').removeClass('active_link');

        // And set position to top of the page
        document.body.scrollTop = document.documentElement.scrollTop = 0;

        var map = {

            // The homepage.
            '': function() {
                document.location = "#select_strains";
                
            },

            '#select_strains': function() {
            	$('.pseudogenomes_select_strains').removeClass('invisible');
                $('#pseudogenomes_download_nav_link').addClass('active_link');

                var table = $('#example').DataTable();
                table.draw();
            },

            '#select_loci': function() {
            	$('.pseudogenomes_select_loci').removeClass('invisible');
                $('#pseudogenomes_download_nav_link').addClass('active_link');
            },

            // submit page
            '#submit': function() {
                if(document.getElementById("align_check").checked) {
                    mode = "aln.fa";
                } else {
                    mode = "fa"
                }
                console.log("'#submit': mode=>"+ mode +"<");

                var gi_selectize = document.getElementById("select-gi").selectize;
                var gis = gi_selectize.getValue();
                var range_selectize = document.getElementById("select-range").selectize;
                var range = range_selectize.getValue();

                console.log("'#submit': strains_selected.length=" + strains_selected.length);

                var err_msg = "";
                var err = 0;
                if( (mode == "fa") && (strains_selected.length == 0)) {
                    console.log("0 strains selected");
                    err = 1;
                    err_msg = "Please select at least 1 accession. ";
                }
                if( (mode == "aln.fa") && (strains_selected.length < 1)) {
                    console.log("0 strains selected");
                    err = 1;
                    err_msg = "Please select at least 2 accession for alignment. ";
                }
                console.log("range_selectize.length="+range_selectize);
                if( (gis == "") && (range == "") ) {
                    err = 1;
                    err_msg += "Please specify a gene or a region.";
                }
                if( (gis != "") && (range != "") ) {
                    err = 1;
                    err_msg += "Please specify either a gene or a region.";
                }

                if(err == 1) {
                    $('.pseudogenomes_download_params').removeClass('invisible');
                    $('#pseudogenomes_download_summary').removeClass('alert-info');
                    $('#pseudogenomes_download_summary').addClass('alert-danger');
                    $('#btn_pseudogenomes_download_fasta').attr('disabled','disabled');
                    document.getElementById("pseudogenomes_download_summary").innerHTML = err_msg;
                }
                else {
                    $('.pseudogenomes_download_status').removeClass('invisible');
                    setStatusText("Your job is beeing processed.");
                    $('#guidText').html("TBA");
                
                    var guid = submit_job(mode);
                }
            },

            // Progress page
            '#progress': function() {
                $('.pseudogenomes_download_status').removeClass('invisible');           
                console.log("spa.js: '#progress': function() {...} ");
                var guid = url.split('#progress/')[1].trim();
                $('#guidText').html(guid);
                sleepFor(2000);

                if(document.getElementById("align_check").checked) {
                    mode = "aln.fa";
                } else {
                    mode = "fa"
                }

                get_status(guid, mode);
            },

            '#download_params': function() {
                $('.pseudogenomes_download_params').removeClass('invisible');
                $('#pseudogenomes_download_nav_link').addClass('active_link');
                $('#btn_pseudogenomes_download_fasta').removeClass('invisible');

                $('#pseudogenomes_download_summary').removeClass('alert-danger');
                $('#pseudogenomes_download_summary').addClass('alert-info');
                $('#btn_pseudogenomes_download_fasta').removeAttr('disabled');

                var gi_selectize = document.getElementById("select-gi").selectize;
                var gis = gi_selectize.getValue();
                var range_selectize = document.getElementById("select-range").selectize;
                var range = range_selectize.getValue();

                var summary_str = "";
                var global_total_bases;
                summary_str = strains_selected.length + " accessions selected";
                if(gis != "") {
                    summary_str += "<br>Gene: " + gis; 
                    global_total_bases = computeTotalGIBases(gis);  
                }
                if(range != "") {
                    summary_str += "<br>Region: " + range;
                    global_total_bases = computeTotalRegionBases(range);
                }

                summary_str += "<br>Total bases: " + numberWithCommas(global_total_bases);

                document.getElementById("pseudogenomes_download_summary").innerHTML = summary_str;

                var resurl = url.split('#download_params/')[1].trim();
                var a = document.getElementById('btn_pseudogenomes_download_fasta');
                a.href = resurl;

                document.getElementById("pseudogenomes_pre_link").innerHTML = "<pre>" + resurl + "</pre>";

                $('.box_wrapper').removeClass('invisible');
                $('#pseudogenomes_download_link').removeClass('invisible');
                $('.download_wrapper').removeClass('invisible');
                $('.warning_wrapper').addClass('invisible');

                document.getElementById("process_download_h2").innerHTML = "Your FASTA file is ready to download";
                $('#btn_pseudogenomes_download_fasta').removeAttr('disabled');

                console.log("spa.js: #download_params: " + summary_str);
            },

            '#download': function() {
                $('.pseudogenomes_download').removeClass('invisible');
                $('#pseudogenomes_download_nav_link').addClass('active_link');
            },

            '#help': function() {
                document.location = "#about";
            },

            '#about': function() {
                console.log("spa.js: #about");
                $('.pseudogenomes_about').removeClass('invisible');
                $('#about_nav_link').addClass('active_link');
            },

            '#error': function() {
                var err_msg = url.split('#error/')[1].trim();
                renderErrorPage(err_msg);
            }

        };

        function renderErrorPage(err_msg) {
        	$('.strain_id_error').removeClass('invisible');
            document.getElementById("error-message-text").innerHTML = err_msg;
        };

        // Execute the needed function depending on the url keyword (stored in temp).
        if(map[temp]){
            map[temp]();
        }
        // If the keyword isn't listed in the above - render the error page.
        else {
            renderErrorPage("Page not found");
        }

    }
});

 