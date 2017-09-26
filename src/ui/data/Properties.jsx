'use strict'
const React = require('react')
const { connect } = require('react-redux')
const immutable = require('immutable')
const PropTypes = require('prop-types')
const { getFlattenedProperties } = require('../../selectors')
const DatePicker = require('react-datepicker').default
const moment = require('moment')
const { toggleFilterProperty, clearFilterProperties, setObservationTimeRange } = require('../../actions')
const { accessors, excludedProperties } = require('./property-names')
const { timestamp, device, survey } = accessors

class Properties extends React.Component {
  constructor (props) {
    super(props)
    this.toggleFilterProperty = this.toggleFilterProperty.bind(this)
    this.clearFilterProperties = this.clearFilterProperties.bind(this)
    this.togglePropertiesPane = this.togglePropertiesPane.bind(this)
    this.setStartDate = this.setStartDate.bind(this)
    this.setEndDate = this.setEndDate.bind(this)
    const timestamps = this.getSortedTimestamps()
    this.state = {
      startDate: timestamps[0],
      endDate: timestamps[timestamps.length - 1],
      showProperties: false
    }
  }

  clearFilterProperties () {
    this.props.clearFilterProperties()
  }

  componentWillMount () {
    this.clearFilterProperties()
  }

  componentWillReceiveProps ({ dateRange }) {
    if (dateRange !== this.props.dateRange) {
      if (!dateRange.size) {
        const timestamps = this.getSortedTimestamps()
        this.setState({
          startDate: timestamps[0],
          endDate: timestamps[timestamps.length - 1]
        })
      } else {
        this.setState({
          startDate: dateRange.first(),
          endDate: dateRange.last()
        })
      }
    }
  }

  getSortedTimestamps () {
    const { properties } = this.props
    if (!properties[timestamp]) return []
    return Object.keys(properties[timestamp]).map(t => new Date(t)).sort()
  }

  render () {
    const { properties } = this.props
    const { showProperties } = this.state
    const timestamps = this.getSortedTimestamps()
    return (
      <aside role='complementary' className='sidebar'>
        <h3>Filter</h3>
        <a className='filterClear clickable' onClick={this.clearFilterProperties}>Clear All</a>
        {timestamps.length ? this.renderTimeRange(timestamps) : null}
        {[device, survey].map(name => {
          return properties[name] ? this.renderProperty(name, properties[name]) : null
        })}
        <h5 className='clickable' onClick={this.togglePropertiesPane}>All properties { showProperties ? '[hide]' : '[show]' }</h5>
        { showProperties ? Object.keys(properties).map(name => {
          if (!properties[name] || excludedProperties.indexOf(name) >= 0) return null
          return this.renderProperty(name, properties[name])
        }) : null }
      </aside>
    )
  }

  renderProperty (name, responses) {
    let activeProperty = this.props.activeProperties.get(name)
    return (
      <fieldset className='property' key={name}>
        <legend htmlFor={`{name}-responses`}>{name}</legend>
        <ul className='filters' id={`${name}-responses`}>
          {Object.keys(responses).map(response => (
            <li key={response} className='filterWrapper clearfix'>
              <input type='checkbox'
                className='checkbox'
                id={'checkbox--' + response}
                checked={activeProperty === response}
                onClick={() => this.toggleFilterProperty(name, response)} />
              <label htmlFor={'checkbox--' + response}>{`${response} (${responses[response]})`}</label>
            </li>
          ))}
        </ul>
      </fieldset>
    )
  }

  renderTimeRange (timestamps) {
    const { startDate, endDate } = this.state
    return (
      <fieldset className='timeRanges'>
        <legend>Date Range</legend>
        <ul>
          <li>
            <label className='label-interior'>Start:</label>
            <DatePicker
              minDate={moment(timestamps[0])}
              maxDate={moment(timestamps[timestamps.length - 1])}
              selected={moment(startDate)}
              onChange={this.setStartDate}
              selectsStart
            />
          </li>
          <li>
            <label className='label-interior'>End:</label>
            <DatePicker
              minDate={moment(timestamps[0])}
              maxDate={moment(timestamps[timestamps.length - 1])}
              selected={moment(endDate)}
              onChange={this.setEndDate}
              selectsEnd
            />
          </li>
        </ul>
      </fieldset>
    )
  }

  setStartDate (start) {
    let startDate = start.valueOf()
    this.props.setObservationTimeRange([startDate, this.state.endDate])
  }

  setEndDate (end) {
    let endDate = end.valueOf()
    this.props.setObservationTimeRange([this.state.startDate, endDate])
  }

  toggleFilterProperty (name, response) {
    this.props.toggleFilterProperty({ k: name, v: response })
  }

  togglePropertiesPane () {
    this.setState({ showProperties: !this.state.showProperties })
  }
}

Properties.propTypes = {
  // immutable list of all observation ids
  observations: PropTypes.instanceOf(immutable.List),
  // object containing feature property names and their count
  properties: PropTypes.object,
  // currently active properties
  activeProperties: PropTypes.instanceOf(immutable.Map)
}

const mapStateToProps = state => {
  return {
    observations: state.observations.get('all'),
    properties: getFlattenedProperties(state),
    dateRange: state.observations.get('dateRange'),
    activeProperties: state.observations.get('filterProperties')
  }
}

module.exports = connect(mapStateToProps, {
  toggleFilterProperty,
  clearFilterProperties,
  setObservationTimeRange
})(Properties)
