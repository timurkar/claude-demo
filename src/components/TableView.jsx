import { useState } from 'react'
import './TableView.css'

const TYPE_ICON = { text: 'T', number: '#', boolean: '◎', date: '▦' }

function AddRowForm({ columns, onAdd, onCancel }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(columns.map((c) => [c.name, '']))
  )

  function handleSubmit(e) {
    e.preventDefault()
    const row = {}
    columns.forEach((c) => {
      const v = values[c.name]
      if (c.type === 'number') row[c.name] = v === '' ? null : Number(v)
      else if (c.type === 'boolean') row[c.name] = v === 'true'
      else row[c.name] = v
    })
    onAdd(row)
  }

  return (
    <form className="tv__add-form" onSubmit={handleSubmit}>
      <div className="tv__add-fields">
        {columns.map((c) => (
          <div key={c.name} className="tv__add-field">
            <label className="tv__add-label">{c.name}</label>
            {c.type === 'boolean' ? (
              <select
                className="tv__add-input"
                value={values[c.name]}
                onChange={(e) => setValues((p) => ({ ...p, [c.name]: e.target.value }))}
              >
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            ) : (
              <input
                className="tv__add-input"
                type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text'}
                value={values[c.name]}
                onChange={(e) => setValues((p) => ({ ...p, [c.name]: e.target.value }))}
                placeholder={c.type}
              />
            )}
          </div>
        ))}
      </div>
      <div className="tv__add-actions">
        <button type="submit" className="tv__btn tv__btn--primary">Add Row</button>
        <button type="button" className="tv__btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

function TableCard({ table, onDeleteTable, onDeleteRow, onInsertRow }) {
  const [addingRow, setAddingRow] = useState(false)

  return (
    <div className="tv__card">
      <div className="tv__card-header">
        <div className="tv__card-title">
          <span className="tv__card-icon">⊞</span>
          <span className="tv__card-name">{table.name}</span>
          <span className="tv__card-meta">
            {table.columns.length} col{table.columns.length !== 1 ? 's' : ''}
            {' · '}
            {table.rows.length} row{table.rows.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          className="tv__delete-table-btn"
          title="Delete table"
          onClick={() => onDeleteTable(table.id)}
        >
          🗑
        </button>
      </div>

      <div className="tv__table-wrap">
        <table className="tv__table">
          <thead>
            <tr>
              {table.columns.map((c) => (
                <th key={c.name} className="tv__th">
                  <span className="tv__type-badge">{TYPE_ICON[c.type] ?? 'T'}</span>
                  {c.name}
                </th>
              ))}
              <th className="tv__th tv__th--action" />
            </tr>
          </thead>
          <tbody>
            {table.rows.length === 0 ? (
              <tr>
                <td colSpan={table.columns.length + 1} className="tv__empty-row">
                  No rows yet
                </td>
              </tr>
            ) : (
              table.rows.map((row) => (
                <tr key={row._id} className="tv__tr">
                  {table.columns.map((c) => (
                    <td key={c.name} className="tv__td">
                      {row[c.name] === null || row[c.name] === undefined
                        ? <span className="tv__null">—</span>
                        : String(row[c.name])}
                    </td>
                  ))}
                  <td className="tv__td tv__td--action">
                    <button
                      className="tv__row-delete"
                      onClick={() => onDeleteRow(table.id, row._id)}
                      title="Delete row"
                    >×</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {addingRow ? (
        <AddRowForm
          columns={table.columns}
          onAdd={(row) => { onInsertRow(table.id, row); setAddingRow(false) }}
          onCancel={() => setAddingRow(false)}
        />
      ) : (
        <button className="tv__add-row-btn" onClick={() => setAddingRow(true)}>
          + Add Row
        </button>
      )}
    </div>
  )
}

export default function TableView({ tables, onDeleteTable, onDeleteRow, onInsertRow }) {
  if (!tables || tables.length === 0) {
    return (
      <div className="tv__empty">
        <div className="tv__empty-icon">⊞</div>
        <p className="tv__empty-text">No tables yet</p>
        <p className="tv__empty-hint">
          Ask the AI to create tables, e.g. "Create a products table with id, name, price and category columns"
        </p>
      </div>
    )
  }

  return (
    <div className="tv">
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          onDeleteTable={onDeleteTable}
          onDeleteRow={onDeleteRow}
          onInsertRow={onInsertRow}
        />
      ))}
    </div>
  )
}
