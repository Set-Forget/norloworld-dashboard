import { useState, useEffect } from "react";
import useAxios from "axios-hooks";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

import Badge from "./Badge";
import ComboBoxGroup from "./ComboBoxGroup";
import ComboBox from "./ComboBox";
import Spinner from "./Spinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useLocation } from "react-router-dom";

dayjs.extend(isBetween);

const people = [
  {
    name: "Lindsay Walton",
    title: "Front-end Developer",
    email: "lindsay.walton@example.com",
    role: "Member",
  },
  // More people...
];

const endPoint =
  "https://script.google.com/macros/s/AKfycbwTHoBwo4RKtAo1Gz3ad0e8ydwUI4TBACO1Wcqnu9FYu_SFHRTVeXJuPHSeRx9o6W_T/exec";

const isWithinRange = (fixedDate, startDate, endDate) => {
  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).add(1, "day").startOf("day"); // Añade un día y ajusta al inicio del día
  const dateToCheck = dayjs(fixedDate).startOf("day");
  return dateToCheck.isBetween(start, end, null, "[)"); // Nota el cambio a "[)" para incluir el inicio pero no el final
};

function removeDuplicates(data) {
  return data.reduce((accumulator, current) => {
    const isDuplicate = accumulator.findIndex(
      (item) => item.name === current.name
    );
    if (isDuplicate === -1) {
      accumulator.push(current);
    }
    return accumulator;
  }, []);
}

export default function FilteredTable() {
  const [{ data: dataTypes, loading: typeLoading, error: TypeError }] =
    useAxios(endPoint + "?route=getIncidentTypes");
  const [{ data, loading, error }] = useAxios(endPoint + "?route=getIncidents");
  const [filteredData, setFilteredData] = useState([]);
  const [LocationChanged, setLocationChanged] = useState(false);

  const [filters, setFilters] = useState({
    "Driver Name": "",
    Terminal: "",
    Type: "",
  });

  const [newfilters, setnewFilters] = useState({
    "Driver Name": [],
    Terminal: [],
    Type: [],
    startDate: "",
    endDate: "",
  });

  const handleFilterChange = (e, selector) => {
    if (selector === "startDate" || selector === "endDate")
      return setnewFilters((prev) => ({ ...prev, [selector]: e }));
    const { name } = e;
    setFilters((prev) => ({ ...prev, [selector]: name.trim() }));
    setnewFilters((prev) => {
      const existingValues = prev[selector];
      if (!existingValues.includes(name.trim())) {
        return { ...prev, [selector]: [...existingValues, name.trim()] };
      }
      return prev;
    });
  };

  const applyFilters = (e) => {
    e && e.preventDefault();
    if (data) {
      const sortedFilteredData = data.filter(
        (item) =>
          (newfilters["Driver Name"].length
            ? newfilters["Driver Name"]
                .map((name) => name.toLowerCase())
                .includes(item["Driver Name"].toLowerCase())
            : true) &&
          (newfilters["Terminal"].length
            ? newfilters["Terminal"]
                .map((name) => name.toLowerCase())
                .includes(item["Terminal"].toLowerCase())
            : true) &&
          (newfilters["Type"].length
            ? newfilters["Type"].includes(item["Type"])
            : true) &&
          (newfilters.startDate && newfilters.endDate
            ? isWithinRange(
                item["Date Time"],
                newfilters.startDate,
                newfilters.endDate
              )
            : true) // &&
      );
      setFilteredData(sortedFilteredData);

      console.log("Apply Filter");
    }
  };

  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const driver = queryParams.get("driver");
    const startMonth = queryParams.get("startMonth");
    const endMonth = queryParams.get("endMonth");
    const fromStatsTable = queryParams.get("fromStatsTable");

    if (fromStatsTable) {
      if (driver !== "undefined") {
        setnewFilters((prevFilters) => ({
          ...prevFilters,
          "Driver Name": [driver],
        }));
      }
      if (startMonth && endMonth) {
        setnewFilters((prevFilters) => ({
          ...prevFilters,
          startDate: new Date(startMonth),
          endDate: new Date(endMonth),
        }));
        setLocationChanged(true);
      }
    }
  }, [location]);

  useEffect(() => {
    if (LocationChanged) {
      applyFilters();
    }
  }, [LocationChanged]);

  const handleClear = () => {
    setnewFilters((prevState) => ({
      ...prevState,
      "Driver Name": [],
      Terminal: [],
      Type: [],
      startDate: "",
      endDate: "",
    }));
    setFilteredData(data);
  };

  const removeItem = (i, prop) => {
    const arr = [
      ...newfilters[prop].slice(0, i),
      ...newfilters[prop].slice(i + 1),
    ];
    setnewFilters((prev) => ({ ...prev, [prop]: arr }));
  };

  useEffect(() => {
    if (data) {
      setFilteredData(data);
    }
  }, [data]);

  if (loading || typeLoading) return <Spinner />;

  let drivers = dataTypes.drivers.map((driver, i) => ({
    id: i,
    name: driver[0],
  }));

  let homeTerminal = dataTypes.drivers.map((driver, i) => ({
    id: i,
    name: driver[1],
  }));

  let allHomeTerminal = removeDuplicates(homeTerminal);

  console.log(filteredData);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-start md:items-start lg:items-center lg:justify-around">
        {drivers && dataTypes && (
          <div className="sm:flex justify-between w-full">
            {/* <h1 className="text-base font-semibold leading-6 text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all the users in your account including their name, title, email and role.
          </p> */}
            <ComboBox
              title="By Drivers"
              items={drivers}
              selectedPerson={filters["Driver Name"]?.name || ""}
              setSelectedPerson={(e) => handleFilterChange(e, "Driver Name")}
            />

            <ComboBox
              title="By Terminal"
              items={allHomeTerminal}
              selectedPerson={filters["Terminal"]?.name || ""}
              setSelectedPerson={(e) => handleFilterChange(e, "Terminal")}
            />

            <ComboBoxGroup
              title="By Incident Type"
              items={dataTypes.types.map((typeone) => ({
                ...typeone,
                items: typeone.items.map((item) => ({ id: item, name: item })),
              }))}
              selectedPerson={filters["Type"]?.name || ""}
              setSelectedPerson={(e) => handleFilterChange(e, "Type")}
            />

            <div className="block">
              <label
                className="block text-sm font-medium leading-6 text-gray-900 mb-2"
                htmlFor="start"
              >
                Start date:
              </label>
              <DatePicker
                selected={newfilters.startDate}
                onChange={(date) => handleFilterChange(date, "startDate")}
                isClearable={true}
                dateFormat="yyyy-MM-dd"
                className="h-9 m-0 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 border-none"
                placeholderText="Select a start date"
              />
            </div>

            <div className="block">
              <label
                className="block text-sm font-medium leading-6 text-gray-900 mb-2"
                htmlFor="end"
              >
                End date:
              </label>
              <DatePicker
                selected={newfilters.endDate}
                onChange={(date) => handleFilterChange(date, "endDate")}
                isClearable={true}
                dateFormat="yyyy-MM-dd"
                className="h-9 m-0 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 border-none"
                placeholderText="Select an end date"
              />
            </div>
          </div>
        )}
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex">
          {/* <label className="block text-sm font-medium leading-6 text-gray-900 mb-2" htmlFor="start">End date:</label> */}
          <button
            type="button"
            onClick={applyFilters}
            className="block h-9 w-32 rounded-md bg-[#125e4d] px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-4 mr-4"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="block h-9 w-32 rounded-md bg-gray-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-4"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="my-4 flex justify-between px-2 gap-2">
        <div className="flex flex-wrap gap-2 place-content-center ">
          {newfilters["Driver Name"]
            .filter((name) => name)
            .map((text, i) => (
              <Badge
                key={text}
                text={text}
                onClick={() => removeItem(i, "Driver Name")}
              />
            ))}
          {newfilters["Terminal"]
            .filter((name) => name)
            .map((text, i) => (
              <Badge
                key={text}
                text={text}
                onClick={() => removeItem(i, "Terminal")}
              />
            ))}
          {newfilters["Type"]
            .filter((name) => name)
            .map((text, i) => (
              <Badge
                key={text}
                text={text}
                onClick={() => removeItem(i, "Type")}
              />
            ))}
        </div>
        <p className="w-fit">Total: {filteredData.length}</p>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Driver Name
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Terminal
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Date Time
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Incident
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Documented by
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      AMOUNT $ TICKET OR DAMAGE
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      CSA BASIC Category & Group Description
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      CSA Points
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Attachment
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Action
                    </th>
                    {/* <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredData.map((person) => (
                    <tr key={uuidv4()}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {person["Driver Name"]}
                      </td>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {person["Terminal"]}
                      </td>
                      {/* <td className=" px-3 py-4 text-sm text-gray-500">{person['Driver Name']}</td> */}
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {person["Date Time"]}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {person["Incident"]}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {person["Documented By"]}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {person["Type"]}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {person["AMOUNT $ TICKET OR DAMAGE"]}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {person["CSA BASIC Category & Group Description"]}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {person["CSA Points"]}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {person["ATTACHMENT"] &&
                          person["ATTACHMENT"]
                            .split("\n")
                            .map((attachment, index, array) => (
                              <>
                                <a
                                  key={index}
                                  href={attachment.trim()}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  File {index + 1}
                                </a>
                                {index < array.length - 1 && (
                                  <>
                                    <br />
                                  </>
                                )}
                              </>
                            ))}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {person["ACTION"]}
                      </td>
                      {/* <td className="relative  py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <a href="#" className="text-indigo-600 hover:text-indigo-900">
                          Edit<span className="sr-only">, {person.name}</span>
                        </a>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
