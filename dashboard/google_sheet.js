/******************** ENTRY ********************/
function doPost(e) {
  console.log('=== doPost called ===');
  console.log('Parameters:', e.parameters);
  
  try {
    const action = e.parameters.action[0];
    const password = e.parameters.password[0];
    
    console.log('Action:', action);
    console.log('Password provided:', password ? 'yes' : 'no');
    
    if (action === 'dashboard') {
      validatePassword(password);
      return jsonResponse(getDashboardData());
    }
    
    return jsonResponse({ error: 'Invalid action' }, 400);
    
  } catch (err) {
    console.log('ERROR in doPost:', err.message);
    return jsonResponse({ error: err.message }, 401);
  }
}
function doGet(e) {
  console.log('=== doGet called ===');
  
  try {
    const params = parseUrlParams(e.queryString);
    
    if (params.action === 'dashboard') {
      validatePassword(params.password);
      return jsonResponse(getDashboardData());
    }
    
    if (params.action === 'finance_p1') {
      validatePassword(params.password);
      return jsonResponse(getFinances('Finances_P1'));
    }
    
    return jsonResponse({ error: 'Invalid action' }, 400);
  } catch (err) {
    console.log('ERROR in doGet:', err.message);
    return jsonResponse({ error: err.message }, 401);
  }
}
/******************** PARAM PARSING ********************/
function parseUrlParams(queryString) {
  const params = {};
  if (!queryString) return params;
  
  const pairs = queryString.split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    if (pair.length === 2) {
      params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
  }
  return params;
}
/******************** AUTH ********************/
function validatePassword(password) {
  if (password !== SIMPLE_PASSWORD) {
    throw new Error('Invalid password');
  }
}
/******************** BUSINESS LOGIC ********************/
function getDashboardData() {
  console.log('=== getDashboardData called ===');
  
  try {
    console.log('Opening spreadsheet:', SPREADSHEET_ID);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('Spreadsheet opened:', ss.getName());
    
    console.log('Getting tasks data...');
    const tasks = getTasksData(ss);
    
    console.log('Getting finances data...');
    const finances = {
      p1: getFinances(ss, 'Finances_P1'),
      p2: getFinances(ss, 'Finances_P2'),
      p3: getFinances(ss, 'Finances_P3')
    };
    
    console.log('Available sheets:', ss.getSheets().map(s => s.getName()));
    
    const result = { tasks, finances };
    console.log('Final dashboard data:', result);
    
    return result;
    
  } catch (err) {
    console.log('ERROR in getDashboardData:', err.message);
    console.log('ERROR stack:', err.stack);
    throw new Error('Cannot get dashboard data: ' + err.message);
  }
}
function getTasksData(ss) {
  console.log('=== getTasksData called ===');
  
  if (!ss) {
    console.log('ERROR: ss is undefined in getTasksData');
    return { today: [], week: [] };
  }
  
  try {
    const sheet = ss.getSheetByName('Tasks');
    console.log('Tasks sheet found:', sheet ? 'yes' : 'no');
    
    if (!sheet) {
      console.log('Tasks sheet not found');
      return { today: [], week: [] };
    }
    
    const rows = sheet.getDataRange().getValues();
    console.log('Tasks rows found:', rows.length);
    
    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const todayTasks = [];
    const weekTasks = [];
    
    for (let i = 1; i < rows.length; i++) { // Skip header
      const [task, priority, dateStr, status] = rows[i];
      
      if (!task || priority !== 'P1') continue; // Only P1 tasks
      
      const taskDate = new Date(dateStr);
      const isToday = taskDate.toDateString() === today.toDateString();
      const isThisWeek = taskDate <= oneWeekFromNow && taskDate >= today;
      
      const taskObj = {
        task,
        priority,
        date: dateStr,
        status: status || 'Todo'
      };
      
      if (isToday) {
        todayTasks.push(taskObj);
      }
      if (isThisWeek) {
        weekTasks.push(taskObj);
      }
    }
    
    console.log('Today P1 tasks:', todayTasks.length);
    console.log('Week P1 tasks:', weekTasks.length);
    
    return { today: todayTasks, week: weekTasks };
    
  } catch (err) {
    console.log('ERROR in getTasksData:', err.message);
    return { today: [], week: [] };
  }
}
function getFinances(ss, sheetName) {
  console.log(`=== getFinances called for ${sheetName} ===`);
  
  if (!ss) {
    console.log('ERROR: ss is undefined in getFinances');
    return { items: [], total: 0 };
  }
  
  try {
    const sheet = ss.getSheetByName(sheetName);
    console.log(`${sheetName} sheet found:`, sheet ? 'yes' : 'no');
    
    if (!sheet) {
      console.log(`${sheetName} sheet not found`);
      return { items: [], total: 0 };
    }
    
    const rows = sheet.getDataRange().getValues();
    console.log(`${sheetName} rows found:`, rows.length);
    
    const items = [];
    let total = 0;
    
    for (let i = 1; i < rows.length; i++) { // Start from row 2 (skip header)
      const [item, category, cost] = rows[i];
      
      if (!item || item === 'Total') continue;
      
      const c = Number(cost) || 0;
      items.push({ item, category, cost: c });
      total += c;
    }
    
    console.log(`${sheetName}: ${items.length} items, total: ${total}`);
    
    return { items, total };
    
  } catch (err) {
    console.log(`ERROR getting ${sheetName}:`, err.message);
    return { items: [], total: 0 };
  }
}
function getP1Finances() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return getFinances(ss, 'info');
  } catch (err) {
    console.log('ERROR in getP1Finances:', err.message);
    return { items: [], total: 0 };
  }
}
/******************** HELPERS ********************/
function jsonResponse(data, status = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}