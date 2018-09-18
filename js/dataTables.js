/**
 * dataTables.js - Handles the Pseudogenomes accession table.
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

var strains_selected = [];
var table;
var heightOffset = 480;

$(document).ready(function (){

   table = $('#example').DataTable({
      'ajax': {
         "url": "/data/1135.json",
            "dataSrc": function ( json ) {
                  delete json.kind;
                  delete json.columns;
                  
                  for ( var i=0, ien=json.rows.length ; i<ien ; i++ ) {
                     // Add additional ecotype_id column
                     json.rows[i].unshift(json.rows[i][0]);
                  }

                  return json.rows;
            }
      },
      'columnDefs': [{
         'targets': 0,
         'searchable': false,
         'orderable': false,
         'className': 'dt-body-center',
         'render': function (data, type, full, meta){
             return '<input type="checkbox" name="id[]" value="' + $('<div/>').text(data).html() + '">';
         }
      }],
      "deferRender": true,
        "paging":   false,
        "ordering": true,
        "info":     false,
        "oLanguage": {
         "sInfo": "", //Showing _TOTAL_ strains",
            "sInfoFiltered": "", //" filtered from _MAX_ records",
            "sInfoEmpty": "No entries to show.",
            "sSearch": "Filter records:",
      },
      'order': [[1, 'asc']],
      "sScrollY": ($(window).height() - heightOffset),
      "scrollX": false,
   });

   // Handle click on "Select all" control
   $('#example_select_all').on('click', function(){
      // Check/uncheck all checkboxes in the table
      var rows = table.rows({ 'search': 'applied' }).nodes();
      $('input[type="checkbox"]', rows).prop('checked', this.checked);
   });

   // Handle click on checkbox to set state of "Select all" control
   $('#example tbody').on('change', 'input[type="checkbox"]', function(){
      // If checkbox is not checked
      if(!this.checked){
         var el = $('#example_select_all').get(0);
         // If "Select all" control is checked and has 'indeterminate' property
         if(el && el.checked && ('indeterminate' in el)){
            // Set visual state of "Select all" control 
            // as 'indeterminate'
            el.indeterminate = true;
         }
      }
   });
});

/* Resize the dataTable */
$(window).resize(function() {
  console.log($(window).height());
  console.log($('.example').css('height'));
  $('.dataTables_scrollBody').css('height', ($(window).height() - heightOffset));
});