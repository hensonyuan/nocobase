import React, {
  Children,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  forwardRef,
} from 'react';
import {
  connect,
  observer,
  mapProps,
  mapReadPretty,
  useField,
  useFieldSchema,
  RecursionField,
  Schema,
  SchemaOptionsContext,
  FormProvider,
  useForm,
} from '@formily/react';
import {
  Menu as AntdMenu,
  MenuProps,
  MenuItemProps,
  SubMenuProps,
  DividerProps,
  Dropdown,
  Modal,
  Button,
} from 'antd';
import { uid } from '@formily/shared';
import cls from 'classnames';
import { useDesignable } from '../../components/schema-renderer';
import { MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { IconPicker } from '../../components/icon-picker';
import { useDefaultAction, VisibleContext } from '..';
import { useMount } from 'ahooks';
import './style.less';
import { Link } from 'react-router-dom';
import { useSchemaPath } from '@nocobase/client/lib';
import { request } from '../';

export const MenuModeContext = createContext(null);

function useSelectedKey() {}

const SideMenu = (props: any) => {
  const { visible, selectedKey, onSelect, path } = props;
  const { schema } = useDesignable();
  if (!selectedKey || !visible) {
    return null;
  }
  const child = schema.properties && schema.properties[selectedKey];
  if (!child || child['x-component'] !== 'Menu.SubMenu') {
    return null;
  }

  return (
    <MenuModeContext.Provider value={'inline'}>
      <AntdMenu mode={'inline'} onSelect={onSelect}>
        <RecursionField schema={child} onlyRenderProperties />
        <Menu.AddNew key={uid()} path={[...path, selectedKey]}>
          <Button block type={'dashed'}>
            <PlusOutlined className={'nb-add-new-icon'} />
          </Button>
        </Menu.AddNew>
      </AntdMenu>
    </MenuModeContext.Provider>
  );
};

export const Menu: any = observer((props: any) => {
  const { mode, onSelect, sideMenuRef, ...others } = props;
  const { schema } = useDesignable();
  const [selectedKey, setSelectedKey] = useState(null);
  const ref = useRef();
  const path = useSchemaPath();
  const child = schema.properties && schema.properties[selectedKey];
  const isSubMenu = child && child['x-component'] === 'Menu.SubMenu';

  useMount(() => {
    if (mode !== 'mix') {
      return;
    }
    const sideMenuElement = sideMenuRef && (sideMenuRef.current as HTMLElement);
    if (sideMenuElement && ref.current) {
      sideMenuElement.querySelector(':scope > div').appendChild(ref.current);
    }
    sideMenuElement.style.display = isSubMenu ? 'block' : 'none';
  });

  useEffect(() => {
    const sideMenuElement = sideMenuRef && (sideMenuRef.current as HTMLElement);
    if (!sideMenuElement) {
      return;
    }
    sideMenuElement.style.display = isSubMenu ? 'block' : 'none';
  }, [selectedKey]);

  return (
    <MenuModeContext.Provider value={mode}>
      <AntdMenu
        {...others}
        mode={mode === 'mix' ? 'horizontal' : mode}
        onSelect={(info) => {
          if (mode === 'mix') {
            setSelectedKey(info.key);
          }
          onSelect && onSelect(info);
        }}
      >
        <RecursionField schema={schema} onlyRenderProperties />
        <Menu.AddNew key={uid()} path={path}>
          <PlusOutlined className={'nb-add-new-icon'} />
        </Menu.AddNew>
      </AntdMenu>
      {mode === 'mix' && (
        <div ref={ref}>
          <SideMenu
            path={path}
            onSelect={onSelect}
            visible={mode === 'mix'}
            selectedKey={selectedKey}
            sideMenuRef={sideMenuRef}
          />
        </div>
      )}
    </MenuModeContext.Provider>
  );
});

Menu.AddNew = observer((props: any) => {
  const { appendChild } = useDesignable(props.path);
  return (
    <AntdMenu.ItemGroup
      className={'nb-menu-add-new'}
      title={
        <Dropdown
          overlay={
            <AntdMenu>
              <AntdMenu.Item
                onClick={async () => {
                  const data = appendChild({
                    type: 'void',
                    title: uid(),
                    'x-component': 'Menu.Item',
                    'x-designable-bar': 'Menu.DesignableBar',
                  });
                  if (data['key']) {
                    await request('ui_schemas:create', {
                      method: 'post',
                      data: data.toJSON(),
                    });
                  }
                }}
              >
                新建菜单
              </AntdMenu.Item>
              <AntdMenu.Item
                onClick={async () => {
                  const data = appendChild({
                    type: 'void',
                    key: uid(),
                    title: uid(),
                    'x-component': 'Menu.SubMenu',
                    'x-designable-bar': 'Menu.DesignableBar',
                  });
                  if (data['key']) {
                    await request('ui_schemas:create', {
                      method: 'post',
                      data: data.toJSON(),
                    });
                  }
                }}
              >
                新建菜单组
              </AntdMenu.Item>
            </AntdMenu>
          }
        >
          <a>{props.children}</a>
        </Dropdown>
      }
    />
  );
});

Menu.Divider = observer(AntdMenu.Divider);

Menu.Item = observer((props: any) => {
  const { icon } = props;
  const { schema, DesignableBar } = useDesignable();
  return (
    <AntdMenu.Item
      {...props}
      icon={<IconPicker type={icon} />}
      eventKey={schema.name}
      key={schema.name}
    >
      {schema.title}
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.Link = observer((props: any) => {
  const { icon } = props;
  const { schema, DesignableBar } = useDesignable();
  return (
    <AntdMenu.Item
      {...props}
      icon={<IconPicker type={icon} />}
      eventKey={schema.name}
      key={schema.name}
    >
      <Link to={props.to}>{schema.title}</Link>
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.URL = observer((props: any) => {
  const { icon } = props;
  const { schema, DesignableBar } = useDesignable();
  return (
    <AntdMenu.Item
      {...props}
      icon={<IconPicker type={icon} />}
      eventKey={schema.name}
      key={schema.name}
    >
      <a target={'_blank'} href={props.href}>
        {schema.title}
      </a>
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.Action = observer((props: any) => {
  const { icon, useAction = useDefaultAction, ...others } = props;
  const { schema, DesignableBar } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { run } = useAction();
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <AntdMenu.Item
        {...others}
        key={schema.name}
        eventKey={schema.name}
        icon={<IconPicker type={icon} />}
        onClick={async () => {
          await run();
          setVisible(true);
        }}
      >
        {schema.title}
        <DesignableBar />
      </AntdMenu.Item>
      {props.children}
      {/* <RecursionField schema={schema} onlyRenderProperties /> */}
    </VisibleContext.Provider>
  );
});

Menu.SubMenu = observer((props: any) => {
  const { icon } = props;
  const { schema, DesignableBar } = useDesignable();
  const mode = useContext(MenuModeContext);
  return mode === 'mix' ? (
    <Menu.Item {...props} />
  ) : (
    <AntdMenu.SubMenu
      {...props}
      icon={<IconPicker type={icon} />}
      title={
        <>
          {schema.title} <DesignableBar />
        </>
      }
      eventKey={schema.name}
      key={schema.name}
    >
      <RecursionField schema={schema} onlyRenderProperties />
    </AntdMenu.SubMenu>
  );
});

Menu.DesignableBar = (props) => {
  const field = useField();
  const [visible, setVisible] = useState(false);
  const { schema, remove, refresh, insertAfter, appendChild } = useDesignable();
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className={'designable-bar-actions'}
      >
        <Dropdown
          overlayStyle={{
            minWidth: 150,
          }}
          // visible={visible}
          // onVisibleChange={(visible) => {
          //   setVisible(visible);
          // }}
          trigger={['click']}
          overlay={
            <AntdMenu>
              <AntdMenu.Item
                onClick={() => {
                  const title = uid();
                  field.componentProps['icon'] = 'DeleteOutlined';
                  schema['x-component-props'] =
                    schema['x-component-props'] || {};
                  schema['x-component-props']['icon'] = 'DeleteOutlined';
                  schema.title = title;
                  refresh();
                }}
              >
                修改标题
              </AntdMenu.Item>
              <AntdMenu.Item
                onClick={async () => {
                  const s = insertAfter({
                    type: 'void',
                    title: uid(),
                    'x-component': 'Menu.SubMenu',
                  });
                  console.log('s.s.s.s', s);
                  if (s['key']) {
                    await request('ui_schemas:create', {
                      method: 'post',
                      data: s.toJSON(),
                    });
                  }
                }}
              >
                新建分组
              </AntdMenu.Item>
              <AntdMenu.Item
                onClick={async () => {
                  const s = insertAfter({
                    type: 'void',
                    title: uid(),
                    'x-component': 'Menu.Item',
                  });
                  if (s['key']) {
                    await request('ui_schemas:create', {
                      method: 'post',
                      data: s.toJSON(),
                    });
                  }
                }}
              >
                新建菜单
              </AntdMenu.Item>
              <AntdMenu.Item
                onClick={async () => {
                  const s = appendChild({
                    type: 'void',
                    title: uid(),
                    'x-component': 'Menu.Item',
                  });
                  if (s['key']) {
                    await request('ui_schemas:create', {
                      method: 'post',
                      data: s.toJSON(),
                    });
                  }
                }}
              >
                在菜单组里新增
              </AntdMenu.Item>
              <AntdMenu.Item
                onClick={() => {
                  Modal.confirm({
                    title: '删除菜单',
                    content: '确认删除此菜单项吗？',
                    onOk: () => {
                      remove();
                    },
                  });
                }}
              >
                删除菜单
              </AntdMenu.Item>
            </AntdMenu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </div>
    </div>
  );
};

export default Menu;
