import { IQueryObject } from '../interface';

export const createQueryObject = (queryObj: IQueryObject) => {
  let newQueryObj = { ...queryObj };
  const excludedFields: string[] = ['page', 'sort', 'take', 'fields'];
  let sort = [];
  let fields = [];

  excludedFields.forEach((el) => delete newQueryObj[el]);

  let queryString = JSON.stringify(newQueryObj);

  queryString = queryString.replace(
    /\b(gte|gt|lte|lt)\b/g,
    (match) => `$${match}`,
  );

  newQueryObj = JSON.parse(queryString);

  if (queryObj.sort) {
    sort = (queryObj.sort as string).split(',');
  }

  if (queryObj.fields) {
    fields = (queryObj.fields as string).split(',');
  }

  const page = (+queryObj.page + 1) * 1 || 1;
  const take = +queryObj.take * 1 || 10;
  const skip = (page - 1) * take;
  const queryOptions = queryObj.page ? { skip, take } : {};

  return {
    sort: createSortArrObj(sort),
    queryObject: newQueryObj,
    queryOptions,
    fields: createSelectedFieldsObj(fields),
  };
};

export const createSelectedFieldsObj = (fields: string[]) => {
  if (fields.length > 0) {
    return fields.reduce((fieldsObj, currentValue) => {
      fieldsObj[currentValue] = true;

      return fieldsObj;
    }, {});
  }

  return null;
};

export const createSortArrObj = (sort: string[]) => {
  if (sort.length > 0) {
    return sort.reduce((sortArr, currentValue) => {
      const sortObj = {};

      currentValue.includes('-')
        ? (sortObj[currentValue.split('-').join('')] = 'desc')
        : (sortObj[currentValue] = 'asc');

      sortArr.push(sortObj);

      return sortArr;
    }, []);
  }

  return [
    {
      createdAt: 'desc',
    },
  ];
};
