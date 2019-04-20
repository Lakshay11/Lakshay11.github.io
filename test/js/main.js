$.getJSON("https://dev-testamp.pantheonsite.io/rest/data", function(data) {
  console.log(data.title);
  $(".wrapper").append('<h1>' + data.title + '</h1>');
});

const invocation = new XMLHttpRequest();
const url = 'https://dev-testamp.pantheonsite.io/rest/data';

function callOtherDomain(){
  if(invocation) {
    invocation.open('GET', url, true);
    invocation.withCredentials = true;
    invocation.onreadystatechange = handler;
    invocation.send();
  }
}
