/**
 * 1001_pseudogenomes_app.js - The controller of the Pseudogenomes App
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

var job_sumbmit_url = "http://myserver/fcgi-bin/produce_pseudogenomes.fcgi";
var job_state_url = "http://myserver.eb.local//fcgi-bin/pseudogenomes_get_state.fcgi"
var gi2coords_url = 'http://tools.1001genomes.org/api/v1/gi2coords/';

/**
 * Note:
 *
 * The controller communicates with some backend services not included with
 * this frontend tool.
 * The backend is implemented using a job queue, therefore we need to submit
 * jobs and query their states.
 *
 * 1. To submit the job we create POST request to job_sumbmit_url with the 
 * following form-data parameters: 
 * region (e.g. Chr1:4113063..4113122), accs (e.g. 88,10001), and mode (fa 
 * or aln.fa).
 *
 * The Response is a JSON object, e.g.
 *
 *  { "error": "0", 
 *    "guid": "ba9900e8-5e9c-4f4d-b353-a26c4062f31d",
 *    "computing_time" : "n"
 *  }
 *
 * 2. To pull the computing state we use the service defined in job_state_url
 * we create a GET request to job_state_url with the query paramters guid and 
 * mode.
 *
 * The response is a JSON object, e.g.
 *
 *  {
 *    "error":"0",
 *    "id":"1069",
 *    "job_type":"1001_pseudogenomes_align_job",
 *    "file_name":"",
 *    "num_data_points":"68100",
 *    "status":"queued",
 *    "enqueue_datetime":"2018-09-18 15:53:48",
 *    "start_datetime":"0000-00-00 00:00:00",
 *    "finish_datetime":"0000-00-00 00:00:00",
 *    "expected_computing_time":"-1",
 *    "total_computing_time":"0",
 *    "url":"/results/pseudogenomes_res_ba9900e8-5..."
 *  }
 *
 * 3. Once the field status of the above JSON response equals 'finished' we 
 * can request the result file at the location of field 'url'.
 *
*/

var total_bases_gi = 0;
var total_bases_reg = 0;
var total_bases = 0;

/**************************************************************************** 
 * Button handling 
 ***************************************************************************/

$('#btn_pseudogenomes_submit_strains').on('click', function(e) {
  strains_selected = [];

  // Iterate over all checkboxes in the table
  table.$('input[type="checkbox"]:checked').each(function(){
     var checkbox = $(this);
     strains_selected.push( checkbox.val())
  });
  document.location = "#select_loci";
});

$('#btn_pseudogenomes_submit_loci').on('click', function(e) {
    document.location = "#submit";
});

function submit_job(mode) {
  // Submit params and enqueue job
  var formData = new FormData();
  var gi_selectize = document.getElementById("select-gi").selectize;
  var gis = gi_selectize.getValue();
  var range_selectize = document.getElementById("select-range").selectize;
  var range = range_selectize.getValue();

  var reg = "";
  if(gis != "") {
    var request = new XMLHttpRequest();
    request.open('GET', gi2coords_url + gis, false);  // `false` makes the request synchronous
    request.send(null);

    json = request.responseText;
    res = JSON.parse(json);

    reg = res.regions[0].reg_str;
    formData.append("region", reg);
  }
  else if(range != "") {
    formData.append("region", range);
  }

  for (var i = 0; i < strains_selected.length; i++) {
    formData.append("accs", strains_selected[i]);
  }
  formData.append("mode", mode);
  
  var xhr = new XMLHttpRequest();
  xhr.open('POST', job_sumbmit_url, false);
  xhr.onload = reqListenerSubmitQuery;

  xhr.send(formData);
  }

function reqListenerSubmitQuery () {
  console.log("reqListenerSubmitQuery: this.readyState="+this.readyState);
  console.log("reqListenerSubmitQuery: this.status="+this.status);

  if (this.readyState === this.DONE) {
    if (this.status != 200) {
      console.log(this.status);
      document.getElementById("process_download_h2").innerHTML = "Sorry...";
      $('.warning_wrapper').removeClass('alert-warning');
      $('.warning_wrapper').addClass('alert-danger');
      $('.warning_wrapper').removeClass('invisible');
      $('#btn_pseudogenomes_download_fasta').addClass('invisible');
      $('.download_wrapper').removeClass('invisible');
      document.getElementById("download_time_msg").innerHTML = "Service Temporarily Overloaded<br><br>Unfortunately your download was canceled. Please try again in a few minutes.";
    }
    else {
      json = this.responseText;
      res = JSON.parse(json);

      console.log("reqListenerSubmitQuery: json=json");
      $('#guidText').html(res.guid);
      document.location = "#progress/"+res.guid;
    }
  }
}

function sleepFor( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function reqListenerTranslateGI () {
  json = this.responseText;
  res = JSON.parse(json);

  computeTotalBases(res.regions[0].reg_str);
}

function computeTotalGIBases(gi) {
  var request = new XMLHttpRequest();
  request.open('GET', gi2coords_url + gi, false);  // `false` makes the request synchronous
  request.send(null);

  if (request.status === 200) {
    console.log(request.responseText);
  }
  json = request.responseText;
  res = JSON.parse(json);

  regionStr = res.regions[0].reg_str;

  var start = regionStr.split(":")[1].split("..")[0];
  var end = regionStr.split("..")[1];
  var len = end-start+1;

  global_total_bases = strains_selected.length * (end - start + 1);

  return global_total_bases;
}
function computeTotalRegionBases(regionStr) {
  var start = regionStr.split(":")[1].split("..")[0];
  var end = regionStr.split("..")[1];
  var len = end-start+1;

  global_total_bases = strains_selected.length * (end - start + 1);
  return global_total_bases;
}

$('#btn_pseudogenomes_select_loci_back').on('click', function(e) {
  $('.box_wrapper').removeClass('invisible');
  document.location = "#select_strains";
});

$('#btn_pseudogenomes_download_params_back').on('click', function(e) {
  $('.box_wrapper').removeClass('invisible');
  document.location = "#select_loci";
});


/**************************************************************************** 
 * Result handling 
 ***************************************************************************/

var guid;
var intervalID;
var middleware_url = job_state_url;

var result_done = 0;

function setIntervalID(i) {
  intervalID = i;
}

function getIntervalID() {
  return intervalID;
}

function setStatusText(x) {
  var old_status = document.getElementById("statusText").innerHTML;
  document.getElementById("statusText").innerHTML = x;
  var new_status = document.getElementById("statusText").innerHTML;
}

function get_status(g,mode) {
  guid = g;
  var xhr = new XMLHttpRequest();
  var url = middleware_url + '?guid=' + guid + "&mode=" + mode;
  xhr.open('GET', url, true);
  xhr.responseType = 'text';

  xhr.onload = reqListener_get_status;
  
  xhr.send();
}

function reqListener_get_status() {
  json = this.responseText;
  res = JSON.parse(json);
  document.getElementById("statusText").innerHTML = res.status;

  if(res.error == 0) {
    setStatusText(res.status);
    if(res.status == "finished") {
      result_done = 1;
      intervalID = getIntervalID();
      clearInterval(intervalID);
      var url_guid = window.location.hash.split('#res/');
      if(url_guid.length == 2) {
        get_json_res(guid) 
      } else {
        var protocol = location.protocol;
        var slashes = protocol.concat("//");
        var host = slashes.concat(window.location.hostname);
        var url = host + "/" + res.url;
        document.location = "#download_params/" + url;
      }
    }
    else {
      result_done = 0;
      $('#guidText').html(guid);
      setStatusText(res.status);
      $('.strain_id_show_compute_progress').removeClass('invisible'); 
      intervalID = setInterval( get_status(guid, mode), 5000);
    }
  } else {
    document.location = "#error/" + res.msg;
  }
}

function get_json_res(guid) {
  var xhr = new XMLHttpRequest();
  var url = middleware_url + '?guid=' + guid + '&action=get_json_res';
  xhr.open('GET', url, true);
  xhr.responseType = 'text';

  xhr.onload = reqListener_get_json_res;
  
  xhr.send();
}

function reqListener_get_json_res() {
  if(result_done == 1) {
    result_done = 0;
    json = this.responseText;
    res = JSON.parse(json);
  }
}
