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
            hide();
            if (!aData.IsDirectory) {
                $(nRow).bind("click", function(e) {
                    if (!path) return;
                    $.get('/file?path=' + path)
                    .done(function(data) {
                        data = {
                            file: data,
                            Name: path.split('&')[0]
                        };
                        table.fnClearTable();
                        table.fnAddData(data);
                        currentPath = path;
                        setTimeout(function(){ editFile(); }, 500);
                    })
                    .fail(function(){
                        toast('No File');
                    });
                    e.preventDefault();
                });
            } 
            else {
                $(nRow).bind("click", function(e) {
                    $.get('/files?path=' + path)
                    .then(function(data) {
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
                if(data.length === 0){
                    return "<p> No File </p>";
                }
                else if (data.file) {
                    var disable = data.file.indexOf('Error getting the file:') >= 0 ? 'disabled' : '';
                    return "File Name: <input type='text' id='edit-name' value='"+data.Name+"' readonly><br>\
                    <textarea name='file' class='file-content' id='edit-content'>" + data.file + "</textarea>\
                    <button class='edit-file' "+disable+"> Submit </button>";
                }
                else if (data.IsDirectory) {
                    return "<a href='#' target='_blank'><i class='fa fa-folder'></i>&nbsp;" + data.Name + "</a>";
                } 
                else {
                    return "<a href='#' target='_blank'><i class='fa " + getFileIcon(data.Ext) + "'></i>&nbsp;" + data.Name + "</a>";
                }
            }
        }]
    };

    var table = $(".linksholder").dataTable(options);
    
    hide();

    $.get('/files').then(function(data) {
        table.fnClearTable();
        table.fnAddData(data);
    });

    $(".up").bind("click", function(e) {
        if (!currentPath) return;
        var idx = currentPath.lastIndexOf("/");
        var path = currentPath.substr(0, idx);
        $.get('/files?path=' + path)
        .done(function(data) {
            table.fnClearTable();
            table.fnAddData(data);
            currentPath = path;
        });
    });

    $(".create-file").bind("click", function(e) {
        var type = $(".myCheckbox:checked").val();
        var name = $("input#name").val();
        if(name < 3 || type < 2){
            toast('input fields are required')
        }
        else{
            $.post('/create', {path: currentPath, type:type, name: name}, 'application/json')
            .done(function(data) {
                $("input#name").val('');
                $(".myCheckbox:checked").attr('checked', false);
                var ext = name.split(".");
                table.fnAddData({
                    IsDirectory: !!(type === 'directory'),
                    Name: name,
                    Ext:  ext[1] && !(type === 'directory') ? "."+ext[1] : undefined,
                    Path: currentPath ?  currentPath+'/'+name : name
                });
                hide();
                toast(name+' created');
            })
            .fail(function(err){
                toast(err.responseText);
            });
        }
    });

    $(".create-button").bind("click", function(e) {
        toggle();
    });

    function toggle(){
        $('.createHolder').toggle('hide', function() {});
    }

    function hide() {
        $(".createHolder").hide();
    }

    function editFile(){
        $(".edit-file").bind("click", function(e) {
            let request = {
                name: $("input#edit-name").val(),
                content: $("textarea#edit-content").val()
            }
            if(request.name < 3 || request.content < 5){
                toast('input fields are required')
            }
            else{
            $.post('/update', {path: currentPath, content:request.content, name: request.name})
                .then(function(data) {
                    var idx = currentPath.lastIndexOf("/");
                    var path = currentPath.substr(0, idx);
                    $.get('/files?path=' + path).then(function(data) {
                        table.fnClearTable();
                        table.fnAddData(data);
                        currentPath = path;
                    });
                });
            }
            e.preventDefault();
        });
    }

    $('.myCheckbox').click(function() {
        $(this).siblings('input:checkbox').prop('checked', false);
    });

    $('.selectme input:checkbox').click(function() {
        $('.selectme input:checkbox').not(this).prop('checked', false);
    });  

    function toast(msg) {
       $('.toast').html(msg);
       $('.toast').fadeIn(400).delay(1000).fadeOut(400);
    } 

})(jQuery);
