enum Actions {
  FindAll = 'findAll',
  FindOne = 'findOne',
  Create = 'create',
  ChangeOrderStatus = 'changeOrderStatus',
}

export const getActionName = (entityName: string) => {
  return {
    findAll: `${entityName}_${Actions.FindAll}`,
    findOne: `${entityName}_${Actions.FindOne}`,
    create: `${entityName}_${Actions.Create}`,
    changeOrderStatus: `${entityName}_${Actions.ChangeOrderStatus}`,
  };
};
