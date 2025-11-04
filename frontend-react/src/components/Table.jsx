const Table = ({ data, columns, onEdit, onDelete, showActions = false }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data found</p>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key || col}>{col.label || col}</th>
            ))}
            {showActions && <th className="text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id || idx}>
              {columns.map((col) => {
                const key = col.key || col
                const value = row[key]
                return (
                  <td key={key}>
                    {col.render ? col.render(value, row) : (value ?? '-')}
                  </td>
                )
              })}
              {showActions && (
                <td className="text-right">
                  <div className="flex justify-end space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table



