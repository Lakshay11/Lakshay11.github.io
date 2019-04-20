$.getJSON("http://dev-testamp.pantheonsite.io/rest/data", function(data) {
  console.log(data.title);
  $(".wrapper").append('<h1>' + data.title + '</h1>');
});
