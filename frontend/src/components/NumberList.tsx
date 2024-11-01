import React from 'react';

interface NumberItem {
  number: string;
  message?: string;
}

interface NumberListProps {
  numbers: NumberItem[];
}

const NumberList: React.FC<NumberListProps> = ({ numbers }) => {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-medium text-gray-900">Números Cadastrados</h2>
      {numbers.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Nenhum número cadastrado ainda.</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-200">
          {numbers.map((item, index) => (
            <li key={index} className="py-2">
              <span className="text-sm font-medium text-gray-900">{item.number}</span>
              {item.message && (
                <p className="text-sm text-gray-500">{item.message}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NumberList;