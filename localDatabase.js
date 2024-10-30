let reports = []; 

const addReport = (report) => {
  reports.push(report);
};

const getReports = () => {
  return reports;
};

export { addReport, getReports };
