import { useState, useEffect } from 'react'
import useAxios from 'axios-hooks'
import { v4 as uuidv4 } from 'uuid';
import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"

import Badge from "./Badge"
import ComboBoxGroup from './ComboBoxGroup'
import ComboBox from './ComboBox'
import Spinner from './Spinner'

dayjs.extend(isBetween)

const people = [
  { name: 'Lindsay Walton', title: 'Front-end Developer', email: 'lindsay.walton@example.com', role: 'Member' },
  // More people...
]

const endPoint = 'https://script.google.com/macros/s/AKfycbwTHoBwo4RKtAo1Gz3ad0e8ydwUI4TBACO1Wcqnu9FYu_SFHRTVeXJuPHSeRx9o6W_T/exec'

const isWithinRange = (fixedDate, startDate, endDate) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const dateToCheck = dayjs(fixedDate);
  return dateToCheck.isBetween(start, end, null, '[]'); // '[]' indica que es inclusivo de ambas fechas
};

function removeDuplicates(data) {
  return data.reduce((accumulator, current) => {
    const isDuplicate = accumulator.findIndex(item => item.name === current.name);
    if (isDuplicate === -1) {
      accumulator.push(current);
    }
    return accumulator;
  }, []);
}


export default function FilteredTable() {

  const [{ data: dataTypes, loading: typeLoading, error: TypeError }] = useAxios(
    endPoint + '?route=getIncidentTypes'
  )
  const [{ data, loading, error }] = useAxios(
    endPoint + '?route=getIncidents'
  )
  const [filteredData, setFilteredData] = useState([]);

  const [filters, setFilters] = useState({
    "Driver Name": '',
    "TYPE": '',
    startDate: "",
    endDate: ""
  });

  const [newfilters, setnewFilters] = useState({
    "Driver Name": [],
    "TYPE": [],
    startDate: "",
    endDate: ""
  });

  const handleFilterChange = (e, selector) => {
    if (selector === "startDate" || selector === "endDate")
      return setFilters(prev => ({ ...prev, [selector]: e }))
    const { name } = e
    setFilters(prev => ({ ...prev, [selector]: name }))
    setnewFilters(prev => ({ ...prev, [selector]: [...prev[selector], name] }))
  }

  const applyFilters = (e) => {
    e.preventDefault()
    if (data) {
      const sortedFilteredData = data.filter(item => 
          (filters['Driver Name'] ? item['Driver Name']=== filters['Driver Name'] : true) &&
          (filters['TYPE'] ? item['TYPE'] === filters['TYPE'] : true) &&
          ((filters.startDate && filters.endDate) ? isWithinRange(item["Date Time"], filters.startDate, filters.endDate) : true) // &&
        )
      setFilteredData(sortedFilteredData)
    }
  }
  
  const handleClear = () => {
    setFilters(prevState => ({
      ...prevState,
      "Driver Name": '',
      "TYPE": '',
      startDate: '',
      endDate: ''
    }))
  }

  const removeItem = (i, prop) => {
    const arr = [...newfilters[prop].slice(0,i),...newfilters[prop].slice(i+1)]
    setnewFilters(prev => ({ ...prev, [prop]: arr }))
  }

  useEffect(() => {
    if (data) {
      setFilteredData(data);
    }
  }, [data]);
  
  if (loading || typeLoading) return <Spinner />
  
  let drivers = data && data.map((item, i) => ({ id: i, name: item['Driver Name'].trim() }))
  drivers = removeDuplicates(drivers)
  console.log(drivers)
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        {drivers && dataTypes && <div className="sm:flex justify-between w-full">
          {/* <h1 className="text-base font-semibold leading-6 text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all the users in your account including their name, title, email and role.
          </p> */}
            <ComboBox
              title="By Drivers" 
              items={drivers}
              selectedPerson={filters['Driver Name']?.name}
              setSelectedPerson={(e) => handleFilterChange(e, 'Driver Name')}
            />
            
            <ComboBoxGroup
              title="By Incident Type"
              items={dataTypes.types.map(typeone => ({
                  ...typeone, 
                  items: typeone.items.map(item => ({ id: item , name: item }))
                })
              )}
              selectedPerson={filters['TYPE']?.name}
              setSelectedPerson={(e) => handleFilterChange(e, 'TYPE')}
            />

            <div className="block">
              <label className="block text-sm font-medium leading-6 text-gray-900 mb-2" htmlFor="start">Start date:</label>
              <input
                className="h-9 m-0 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 border-none"
                type="date" id="start" name="trip-start" 
                value={filters.startDate} 
                min="2000-07-22" max={new Date()}
                onChange={e => handleFilterChange(e.target.value, 'startDate')}/>
            </div>
            <div className="block">
              <label className="block text-sm font-medium leading-6 text-gray-900 mb-2" htmlFor="start">End date:</label>
              <input
                className="h-9 m-0 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 border-none"
                type="date" id="start" name="trip-start" value={filters.endDate} min="2000-0&-22" max={new Date()}
                onChange={e => handleFilterChange(e.target.value, 'endDate')} />
            </div>
        </div>}
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
      <div className="my-4 flex">
        {newfilters["Driver Name"].map((text, i) => <Badge key={text} text={text} onClick={() => removeItem(i, "Driver Name")} />)}
        {newfilters["TYPE"].map((text, i) => <Badge key={text} text={text} onClick={() => removeItem(i, "TYPE")} />)}
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Driver Name
                    </th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date Time
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Incident
                    </th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Documented by
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Attachment
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
                        {person['Driver Name']}
                      </td>
                      {/* <td className=" px-3 py-4 text-sm text-gray-500">{person['Driver Name']}</td> */}
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{person['Date Time']}</td>
                      <td className="px-3 py-4 text-sm text-gray-500">{person['Incident']}</td>
                      <td className="px-3 py-4 text-sm text-gray-500">{person['Documented By']}</td>
                      <td className="px-3 py-4 text-sm text-gray-500">{person['TYPE']}</td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {person['ATTACHMENT'] && <a href={person['ATTACHMENT']} target='_blank' rel="noreferrer">File</a>}
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
  )
}
