import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Settings } from 'lucide-react';

const FormField = ({ field, isSelected, onSelect, onUpdate, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderField = () => {
    const baseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500";
    const disabledClasses = "bg-gray-100 text-gray-500 cursor-not-allowed";

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            className={`${baseClasses} ${disabledClasses}`}
            disabled
          />
        );
      case 'email':
        return (
          <input
            type="email"
            placeholder={field.placeholder}
            className={`${baseClasses} ${disabledClasses}`}
            disabled
          />
        );
      case 'tel':
        return (
          <input
            type="tel"
            placeholder={field.placeholder}
            className={`${baseClasses} ${disabledClasses}`}
            disabled
          />
        );
      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            className={`${baseClasses} ${disabledClasses}`}
            disabled
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className={`${baseClasses} ${disabledClasses}`}
            disabled
          />
        );
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
              disabled
            />
            <span className="ml-2 text-gray-500">{field.placeholder || 'Opção'}</span>
          </div>
        );
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            className={`${baseClasses} ${disabledClasses}`}
            disabled
          />
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative p-4 border rounded-lg bg-white ${
        isSelected ? 'ring-2 ring-primary-500 border-primary-300' : 'border-gray-200'
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => onSelect()}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Field Content */}
      <div className="ml-8">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 text-red-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {renderField()}
      </div>
    </div>
  );
};

export default FormField; 