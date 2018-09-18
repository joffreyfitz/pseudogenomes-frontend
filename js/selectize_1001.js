/**
 * selectice_1001.js - Configuration for selectize.js.
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


/**
 * Note:
 *
 * This script relys on an autocompletion backend not included in this 
 * frontend package. The backend is inviked with two query parameters 
 * db (the database to be queried) and q (the query itself), e.g.
 *
 * 		http://myserver/autocomplete.fcgi?db=tair&q=AT1G01070
 *
 * The result is a JSON object, e.g.
 *
 * {"genes":[
 * 		{"gi":"AT1G01070.1", "chr":"Chr1", "start":"38752", "end":"40944"},
 * 		{"gi":"AT1G01070.2", "chr":"Chr1", "start":"38752", "end":"40927"}
 *	]}
 */

var select_gi_arr = [];
var select_range_arr = [];

var formatAdditionalInfo = function(item) {
	var arr = [];
	if(item.name != '') {
		arr.push(item.name);
	}
	if(item.othername != '') {
		arr.push(item.othername);
	}
	return "(" + $.trim( arr.join(', ') ) +")";
};

$('#select-gi').selectize({
	maxItems: 1,
	openOnFocus: true,
	valueField: 'gi',
	labelField: 'gi',
	searchField: 'gi',
	sortField: [
		{field: 'gi', direction: 'asc'},
	],
	options: [],
	create: false,	
	
	render: {
		option: function(item, escape) {
			var gi = item.gi;
			var chr = item.chr;
			var start = item.start;
			var end = item.end;

			var additionalInfo = formatAdditionalInfo(item);
			return '<div>' +
				'<span class="label">' +
				gi + " (" + chr + ":" + start + ".." + end + ")" +  
				'</div>';
		}
	},
	load: function(query, callback) {
		if (!query.length) return callback();
		console.log(query);
		$.ajax({
			url: 'http://myserver/fcgi-bin/autocomplete.fcgi?db=tair&q=' + encodeURIComponent(query),
			type: 'GET',
			error: function(req,err) {
				console.log(err);
				callback();
			},
			success: function(res) {
				callback(res.genes);
			}
		});
	},
	onItemAdd: function(value, item) {
		console.log("onItemAdd " + value + ", " + item);
		this.close();
		
	},
	onDelete: function(values) {
		console.log("onDelete " + values);
		this.close();
		this.setActiveItem(null);
		//this.clearOptions(); // clears all
	},
	onOptionRemove: function(value) {
		console.log("onOptionRemove " + values);
		this.close();
	}
});


var RANGE_REGEX = '(Chr)([0-7]):([0-9]+)(\.\.)([0-9]+)'; //[0-7]:[0-9]+\.\.[0-9]+

$('#select-range').selectize({
    maxItems: 1,
    valueField: 'email',
    labelField: 'name',
    searchField: ['email'],
    options: [],
    render: {
        item: function(item, escape) {
            return '<div>' +
                (item.name ? '<span class="name">' + escape(item.name) + '</span>' : '') +
                (item.email ? '<span class="email">' + escape(item.email) + '</span>' : '') +
            '</div>';
        },
        option: function(item, escape) {
            var label = item.name || item.email;
            var caption = item.name ? item.email : null;
            return '<div>' +
                '<span class="label">' + escape(label) + '</span>' +
                (caption ? '<span class="caption">' + escape(caption) + '</span>' : '') +
            '</div>';
        }
    },
    createFilter: function(input) {
        var match, regex;

        regex = new RegExp('^' + RANGE_REGEX + '$', 'i');
        match = input.match(regex);
        if (match) return !this.options.hasOwnProperty(match[0]);

        return false;
    },
    create: function(input) {
        if ((new RegExp('^' + RANGE_REGEX + '$', 'i')).test(input)) {
            return {email: input};
        }
        
        // alert('Invalid email address.');
        // return false;
    },
    onItemAdd: function(value, item) {
		console.log("onItemAdd " + value);
		this.close();
		
	},
});
