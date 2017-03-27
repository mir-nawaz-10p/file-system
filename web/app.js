(function($) {

    var extensionsMap = {
        ".zip": "fa-file-archive-o",
        ".gz": "fa-file-archive-o",
        ".bz2": "fa-file-archive-o",
        ".xz": "fa-file-archive-o",
        ".rar": "fa-file-archive-o",
        ".tar": "fa-file-archive-o",
        ".tgz": "fa-file-archive-o",
        ".tbz2": "fa-file-archive-o",
        ".z": "fa-file-archive-o",
        ".7z": "fa-file-archive-o",
        ".mp3": "fa-file-audio-o",
        ".cs": "fa-file-code-o",
        ".c++": "fa-file-code-o",
        ".cpp": "fa-file-code-o",
        ".js": "fa-file-code-o",
        ".xls": "fa-file-excel-o",
        ".xlsx": "fa-file-excel-o",
        ".png": "fa-file-image-o",
        ".jpg": "fa-file-image-o",
        ".jpeg": "fa-file-image-o",
        ".gif": "fa-file-image-o",
        ".mpeg": "fa-file-movie-o",
        ".pdf": "fa-file-pdf-o",
        ".ppt": "fa-file-powerpoint-o",
        ".pptx": "fa-file-powerpoint-o",
        ".txt": "fa-file-text-o",
        ".log": "fa-file-text-o",
        ".doc": "fa-file-word-o",
        ".docx": "fa-file-word-o",
    };

    function getFileIcon(ext) {
        return (ext && extensionsMap[ext.toLowerCase()]) || 'fa-file-o';
    }

    var currentPath = null;
    var options = {
        "bProcessing": true,
        "bServerSide": false,
        "bPaginate": false,
        "bAutoWidth": false,
        "sScrollY": "250px",
        "fnCreatedRow": function(nRow, aData, iDataIndex) {
            var path = aData.Path;
            if (!aData.IsDirectory) {
                $(nRow).bind("click", function(e) {
                    if (!path) return;
                    $.get('/file-details?path=' + path).then(function(data) {
                        data = {
                            file: data,
                            Name: path.split('&')[0]
                        };
                        table.fnClearTable();
                        table.fnAddData(data);
                        currentPath = path;
                        setTimeout(function(){ editFile(); }, 500);
                    });
                    e.preventDefault();
                });
            } else {
                $(nRow).bind("click", function(e) {
                    $.get('/files?path=' + path).then(function(data) {
                        table.fnClearTable();
                        table.fnAddData(data);
                        currentPath = path;
                    });
                    e.preventDefault();
                });
            }
        },
        "aoColumns": [{
            "sTitle": "",
            "mData": null,
            "bSortable": false,
            "sClass": "head0",
            "sWidth": "55px",
            "render": function(data, type, row, meta) {
                
                if (data.create) {
                    return "File Name: <input type='text' id='file-name'><br>\
                     File Content: <textarea name='file' class='file-text' id='file-content'> </textarea>\
                     <button class='create-file'> Submit </button>";
                }
                if (data.file) {
                    return "File Name: <input type='text' id='edit-name' value='"+data.Name+"' readonly><br>\
                    <textarea name='file' class='file-content' id='edit-content'>" + data.file + "</textarea>\
                    <button class='edit-file'> Submit </button>";
                }
                if (data.IsDirectory) {
                    return "<a href='#' target='_blank'><i class='fa fa-folder'></i>&nbsp;" + data.Name + "</a>";
                } else {
                    return "<a href='#' target='_blank'><i class='fa " + getFileIcon(data.Ext) + "'></i>&nbsp;" + data.Name + "</a>";
                }
            }
        }]
    };

    var table = $(".linksholder").dataTable(options);

    $.get('/files').then(function(data) {
        table.fnClearTable();
        table.fnAddData(data);
    });

    $(".up").bind("click", function(e) {
        if (!currentPath) return;
        var idx = currentPath.lastIndexOf("/");
        var path = currentPath.substr(0, idx);
        $.get('/files?path=' + path).then(function(data) {
            table.fnClearTable();
            table.fnAddData(data);
            currentPath = path;
        });
    });

    $(".create-file").bind("click", function(e) {
        if (!currentPath) currentPath = '';
        if(currentPath.indexOf('/create') >= 0) return;
        currentPath += '/create';
        table.fnClearTable();
        table.fnAddData({create: true});
        setTimeout(function(){ submitFile(); }, 500);
    });

    function submitFile(){
        $(".create-file").bind("click", function(e) {
            let request = {
                name: $("input#file-name").val(),
                content: $("textarea#file-content").val()
            }
            console.log('create file create file create file ');
            console.log(request);
        });
    }

    function editFile(){
        $(".edit-file").bind("click", function(e) {
            let request = {
                name: $("input#edit-name").val(),
                content: $("textarea#edit-content").val()
            }
            console.log('edit file edit file edit file ');
            console.log(request);
        });
    }

})(jQuery);
