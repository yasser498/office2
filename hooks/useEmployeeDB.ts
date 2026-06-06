
import { useState, useEffect, useCallback } from 'react';
import { Employee, Report } from '../types';
import * as dbUtils from '../utils/db';

export const useEmployeeDB = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbUtils.getAllEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const importEmployees = async (data: Omit<Employee, 'id'>[]) => {
    await dbUtils.saveEmployees(data);
    await fetchEmployees();
  };

  const addManualEmployee = async (data: Omit<Employee, 'id'>) => {
    await dbUtils.addEmployee(data);
    await fetchEmployees();
  };

  const getReports = async (employeeId: number) => {
    return await dbUtils.getReportsByEmployee(employeeId);
  };

  const saveReport = async (report: Report) => {
    if (report.id) {
      await dbUtils.updateReport(report);
    } else {
      await dbUtils.addReport(report);
    }
  };

  const removeReport = async (reportId: number) => {
    await dbUtils.deleteReport(reportId);
  };

  const resetData = async () => {
    await dbUtils.deleteEmployeeData();
    await fetchEmployees();
  };

  return {
    employees,
    loading,
    importEmployees,
    addManualEmployee,
    getReports,
    saveReport,
    removeReport,
    resetData,
    refresh: fetchEmployees
  };
};
