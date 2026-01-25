const React = require('react');

const MockGantt = ({ tasks, scales, init, className }) => {
  // initコールバックを呼び出してAPIオブジェクトをモック
  React.useEffect(() => {
    if (init) {
      const mockApi = {
        getState: () => ({ scales: [], start: new Date(), end: new Date() }),
        on: jest.fn(),
        off: jest.fn(),
      };
      init(mockApi);
    }
  }, [init]);
  
  return React.createElement('div', {
    className: `mock-gantt ${className || ''}`,
    'data-testid': 'gantt-chart'
  }, [
    React.createElement('div', {
      'data-testid': 'gantt-tasks',
      key: 'tasks'
    }, JSON.stringify(tasks)),
    React.createElement('div', {
      'data-testid': 'gantt-scales',
      key: 'scales'
    }, JSON.stringify(scales))
  ]);
};

const MockTooltip = ({ children }) => {
  return React.createElement('div', {
    'data-testid': 'tooltip-wrapper'
  }, children);
};

module.exports = {
  Gantt: MockGantt,
  Tooltip: MockTooltip,
};